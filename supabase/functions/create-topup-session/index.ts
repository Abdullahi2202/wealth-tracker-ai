
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required', success: false }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication', success: false }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()

    const userPhone = profile?.phone

    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid request body format. Please send valid JSON.', success: false }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!requestBody || typeof requestBody !== 'object') {
      return new Response(JSON.stringify({ error: 'Request body must be a valid JSON object', success: false }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { amount, currency = 'usd' } = requestBody
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount. Must be a positive number.', success: false }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (amount < 1) {
      return new Response(JSON.stringify({ error: 'Minimum top-up amount is $1.00', success: false }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amountInCents = Math.round(amount * 100)

    let customerId
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id, phone: userPhone || '' },
        })
        customerId = customer.id
      }
    } catch (stripeError) {
      return new Response(JSON.stringify({ error: 'Failed to create or retrieve Stripe customer', success: false }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const originHeader = req.headers.get('origin') || req.headers.get('referer') || Deno.env.get('PUBLIC_SITE_URL') || 'https://your-app.com'
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
          amount_dollars: amount.toString(),
        },
      })
    } catch (stripeError) {
      return new Response(JSON.stringify({ error: 'Failed to create Stripe checkout session', success: false }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error: dbError } = await supabase
      .from('topup_sessions')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: amountInCents,
        currency: currency,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      return new Response(JSON.stringify({ error: 'Failed to create topup session record', success: false }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = {
      session_id: session.id,
      checkout_url: session.url,
      amount: amount,
      currency: currency,
      topup_session_id: data.id,
      success: true,
      message: 'Checkout session created successfully',
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorResponse = {
      error: error?.message || 'Internal server error',
      success: false,
      details: error?.stack || 'No additional details',
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
