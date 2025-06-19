
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Creating setup intent...')
    
    // Validate environment variables
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      throw new Error('Invalid Stripe secret key format')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { email } = await req.json()

    console.log('Request data:', { email })

    if (!email) {
      throw new Error('Email is required')
    }

    console.log('Initializing Stripe with key type:', stripeKey.substring(0, 8) + '...')
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Check if customer exists, create if not
    let customers = await stripe.customers.list({ email, limit: 1 })
    let customerId = customers.data[0]?.id

    if (!customerId) {
      console.log('Creating new Stripe customer...')
      const customer = await stripe.customers.create({ email })
      customerId = customer.id
      console.log('Created customer:', customerId)
    } else {
      console.log('Found existing customer:', customerId)
    }

    console.log('Creating SetupIntent...')
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    console.log('SetupIntent created successfully:', {
      id: setupIntent.id,
      client_secret: setupIntent.client_secret ? 'present' : 'missing',
      status: setupIntent.status
    })

    return new Response(JSON.stringify({ 
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error creating setup intent:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.code ? `Stripe error code: ${error.code}` : 'Server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
