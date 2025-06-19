
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { email } = await req.json()

    console.log('Request data:', { email })

    if (!email) {
      throw new Error('Email is required')
    }

    console.log('Initializing Stripe...')
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
    }

    console.log('Creating SetupIntent...')
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    console.log('SetupIntent created successfully:', setupIntent.id)

    return new Response(JSON.stringify({ 
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error creating setup intent:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
