
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

    // Check if customer exists in Stripe, create if not
    let customers = await stripe.customers.list({ email, limit: 1 })
    let customerId = customers.data[0]?.id

    if (!customerId) {
      console.log('Creating new Stripe customer...')
      const customer = await stripe.customers.create({ 
        email,
        metadata: {
          source: 'payment_app'
        }
      })
      customerId = customer.id
      console.log('Created customer:', customerId)
    } else {
      console.log('Found existing customer:', customerId)
    }

    // Get user from Supabase using the correct method
    console.log('Getting user from Supabase...')
    const { data: users, error: userError } = await supabase
      .from('registration')
      .select('id, email, full_name')
      .eq('email', email)
      .limit(1)

    if (userError) {
      console.error('Error fetching user:', userError)
      throw new Error(`User lookup failed: ${userError.message}`)
    }

    if (!users || users.length === 0) {
      console.error('User not found in registration table')
      throw new Error('User not found. Please ensure you are registered.')
    }

    const user = users[0]
    console.log('Found user:', user.id)

    console.log('Creating SetupIntent for user:', user.id)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        user_id: user.id,
        email: email,
        timestamp: new Date().toISOString()
      }
    })

    console.log('SetupIntent created successfully:', {
      id: setupIntent.id,
      client_secret: setupIntent.client_secret ? 'present' : 'missing',
      status: setupIntent.status,
      customer: customerId
    })

    return new Response(JSON.stringify({ 
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
      customer_id: customerId
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
