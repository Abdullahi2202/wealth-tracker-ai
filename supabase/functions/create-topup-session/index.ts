
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
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get authenticated user
    console.log('Checking authorization header...')
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User authenticated:', user.email)

    // Parse request body
    const body = await req.json()
    const { amount, currency = 'usd' } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid amount provided:', amount)
      return new Response(JSON.stringify({ 
        error: 'Invalid amount. Must be a positive number.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Creating topup session for user:', user.id, 'amount:', amount)
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
        console.log('Found existing customer:', customerId)
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id
          }
        })
        customerId = customer.id
        console.log('Created new customer:', customerId)
      }
    } catch (stripeError) {
      console.error('Stripe customer error:', stripeError)
      return new Response(JSON.stringify({ 
        error: 'Failed to handle Stripe customer' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Stripe Checkout session first
    try {
      const originHeader = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:3000'
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
                description: `Add ${currency.toUpperCase()} ${amount} to your wallet`,
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
          amount_cents: amountInCents.toString(),
          amount_dollars: amount.toString()
        }
      })

      console.log('Stripe session created successfully:', session.id)

      // Now create topup session record with the Stripe session ID
      const { data: topupSession, error: dbError } = await supabase
        .from('topup_sessions')
        .insert({
          user_id: user.id,
          amount: amountInCents,
          currency: currency,
          status: 'pending',
          stripe_session_id: session.id
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error creating topup session:', dbError)
        return new Response(JSON.stringify({ 
          error: 'Failed to create topup session' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Topup session created in DB:', topupSession.id)

      console.log('=== SUCCESS: Returning checkout URL ===')
      return new Response(JSON.stringify({
        session_id: session.id,
        checkout_url: session.url,
        amount: amount,
        currency: currency,
        success: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (stripeError) {
      console.error('Stripe session creation error:', stripeError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create payment session' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('=== CREATE TOPUP SESSION ERROR ===')
    console.error('Error details:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
