
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
    console.log('Token received, length:', token.length)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User authenticated:', user.email)

    // Parse request body with detailed logging
    console.log('Reading request body...')
    let requestText = ''
    try {
      requestText = await req.text()
      console.log('Raw request body received:', requestText)
      console.log('Request body length:', requestText.length)
    } catch (readError) {
      console.error('Error reading request body:', readError)
      return new Response(JSON.stringify({ 
        error: 'Failed to read request body',
        details: readError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (!requestText || requestText.trim() === '') {
      console.error('Request body is empty')
      return new Response(JSON.stringify({ 
        error: 'Request body is required. Please provide amount and currency.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    let body
    try {
      body = JSON.parse(requestText)
      console.log('Successfully parsed request body:', body)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Failed to parse:', requestText)
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON format in request body',
        details: parseError.message,
        receivedBody: requestText 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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

    // Check if customer exists
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
        // Create new customer
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
        error: 'Failed to handle Stripe customer',
        details: stripeError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Checkout session
    let session
    try {
      const originHeader = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:3000'
      const baseUrl = originHeader.replace(/\/$/, '') // Remove trailing slash
      
      session = await stripe.checkout.sessions.create({
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
          user_id: user.id,
          user_email: user.email,
          type: 'wallet_topup',
          amount: amount.toString()
        }
      })

      console.log('Stripe session created successfully:', session.id)
      console.log('Checkout URL:', session.url)
    } catch (stripeError) {
      console.error('Stripe session creation error:', stripeError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create payment session',
        details: stripeError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Store session in database
    try {
      const { data: dbSession, error: dbError } = await supabase
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
        // Don't fail the request if DB save fails, but log it
        console.log('Continuing despite DB error - session created successfully')
      } else {
        console.log('Topup session saved to database:', dbSession.id)
      }

      console.log('=== SUCCESS: Returning checkout URL ===')
      return new Response(JSON.stringify({
        session_id: session.id,
        checkout_url: session.url,
        amount: amount,
        currency: currency
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      // Still return success since Stripe session was created
      return new Response(JSON.stringify({
        session_id: session.id,
        checkout_url: session.url,
        amount: amount,
        currency: currency,
        warning: 'Session created but database save failed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('=== CREATE TOPUP SESSION ERROR ===')
    console.error('Error details:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
