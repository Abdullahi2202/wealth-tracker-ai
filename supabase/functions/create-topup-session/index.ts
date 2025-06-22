
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
})

Deno.serve(async (req) => {
  console.log('=== CREATE TOPUP SESSION STARTED ===')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    console.log('User authenticated:', user.email)

    // Get user profile for phone number
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()

    const userPhone = profile?.phone
    console.log('User profile:', { email: user.email, phone: userPhone })

    // Parse request body with better error handling
    let body
    try {
      const rawBody = await req.text()
      console.log('Raw request body:', rawBody)
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body is empty')
      }
      
      body = JSON.parse(rawBody)
      console.log('Parsed request body:', body)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Invalid JSON in request body')
    }

    const { amount, currency = 'usd' } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid amount. Must be a positive number.')
    }

    console.log('Creating topup session:', { userId: user.id, phone: userPhone, amount })
    const amountInCents = Math.round(amount * 100)

    // Check if customer exists in Stripe
    let customerId
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
      console.log('Found existing Stripe customer:', customerId)
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          phone: userPhone || ''
        }
      })
      customerId = customer.id
      console.log('Created new Stripe customer:', customerId)
    }

    // Create Stripe Checkout session
    const originHeader = req.headers.get('origin') || req.headers.get('referer') || 'https://your-app.com'
    const baseUrl = originHeader.replace(/\/$/, '')
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Wallet Top-up',
              description: `Add $${amount} to your wallet balance`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/payments/topup?success=true&session_id={CHECKOUT_SESSION_ID}&amount=${amount}`,
      cancel_url: `${baseUrl}/payments/topup?canceled=true`,
      metadata: {
        type: 'wallet_topup',
        user_id: user.id,
        user_email: user.email,
        user_phone: userPhone || '',
        amount_cents: amountInCents.toString(),
        amount_dollars: amount.toString()
      }
    })

    console.log('Stripe session created:', session.id)

    // Create topup session record
    const { data: topupSession, error: dbError } = await supabase
      .from('topup_sessions')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: amountInCents,
        currency: currency,
        status: 'pending'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to create topup session record')
    }

    console.log('Topup session record created:', topupSession.id)

    return new Response(JSON.stringify({
      session_id: session.id,
      checkout_url: session.url,
      amount: amount,
      currency: currency,
      topup_session_id: topupSession.id,
      success: true,
      message: 'Checkout session created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== CREATE TOPUP SESSION ERROR ===')
    console.error('Error details:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
