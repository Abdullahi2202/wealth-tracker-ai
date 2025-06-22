
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
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header present:', !!authHeader)
    
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('Auth error:', authError)
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

    // Parse request body with comprehensive error handling
    let requestBody
    try {
      const contentType = req.headers.get('content-type') || ''
      console.log('Content-Type:', contentType)
      
      if (!contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType)
        throw new Error('Content-Type must be application/json')
      }

      const rawBody = await req.text()
      console.log('Raw request body length:', rawBody.length)
      console.log('Raw request body:', rawBody)
      
      if (!rawBody || rawBody.trim() === '' || rawBody === 'undefined' || rawBody === 'null') {
        console.error('Empty or invalid request body')
        throw new Error('Request body is empty or invalid')
      }
      
      requestBody = JSON.parse(rawBody)
      console.log('Parsed request body:', requestBody)
      
      if (!requestBody || typeof requestBody !== 'object') {
        throw new Error('Request body must be a valid JSON object')
      }
      
    } catch (parseError) {
      console.error('Request parsing error:', parseError)
      throw new Error(`Invalid request format: ${parseError.message}`)
    }

    const { amount, currency = 'usd' } = requestBody

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid amount:', amount)
      throw new Error('Invalid amount. Must be a positive number.')
    }

    if (amount < 1) {
      throw new Error('Minimum top-up amount is $1.00')
    }

    console.log('Creating topup session:', { userId: user.id, phone: userPhone, amount })
    const amountInCents = Math.round(amount * 100)

    // Check if customer exists in Stripe
    let customerId
    try {
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
    } catch (stripeError) {
      console.error('Stripe customer error:', stripeError)
      throw new Error('Failed to create or retrieve Stripe customer')
    }

    // Create Stripe Checkout session
    const originHeader = req.headers.get('origin') || req.headers.get('referer') || 'https://your-app.com'
    const baseUrl = originHeader.replace(/\/$/, '')
    
    let session
    try {
      session = await stripe.checkout.sessions.create({
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
    } catch (stripeError) {
      console.error('Stripe session creation error:', stripeError)
      throw new Error('Failed to create Stripe checkout session')
    }

    // Create topup session record
    let topupSession
    try {
      const { data, error: dbError } = await supabase
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
      
      topupSession = data
      console.log('Topup session record created:', topupSession.id)
    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      throw new Error('Failed to save topup session')
    }

    const response = {
      session_id: session.id,
      checkout_url: session.url,
      amount: amount,
      currency: currency,
      topup_session_id: topupSession.id,
      success: true,
      message: 'Checkout session created successfully'
    }

    console.log('Sending successful response:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('=== CREATE TOPUP SESSION ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error?.message || 'Unknown error')
    console.error('Error stack:', error?.stack || 'No stack trace')
    
    const errorResponse = { 
      error: error?.message || 'Internal server error',
      success: false,
      details: error?.stack || 'No additional details'
    }
    
    console.log('Sending error response:', errorResponse)
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
