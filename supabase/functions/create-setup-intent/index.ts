
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
    console.log('=== CREATE SETUP INTENT START ===')
    
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY is not configured')
      throw new Error('Payment system not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { email } = await req.json()

    console.log('Creating setup intent for email:', email)

    if (!email) {
      throw new Error('Email is required')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      timeout: 10000, // 10 second timeout
    })

    // Find or create Stripe customer
    console.log('Looking for existing Stripe customer...')
    const customers = await stripe.customers.list({ 
      email, 
      limit: 1 
    })
    
    let customerId = customers.data[0]?.id

    if (!customerId) {
      console.log('Creating new Stripe customer for:', email)
      const customer = await stripe.customers.create({ 
        email,
        metadata: {
          source: 'payment_app',
          created_at: new Date().toISOString()
        }
      })
      customerId = customer.id
      console.log('Created new customer:', customerId)
    } else {
      console.log('Found existing customer:', customerId)
    }

    // Get user from registration table
    console.log('Fetching user from registration table...')
    const { data: users, error: userError } = await supabase
      .from('registration')
      .select('id, email, full_name')
      .eq('email', email)
      .limit(1)

    if (userError) {
      console.error('Error fetching user from registration:', userError)
      throw new Error(`User lookup failed: ${userError.message}`)
    }

    if (!users || users.length === 0) {
      console.error('User not found in registration table for email:', email)
      throw new Error('User not found. Please ensure you are registered.')
    }

    const user = users[0]
    console.log('Found user in registration:', user.id)

    // Create SetupIntent with FIXED configuration - use only payment_method_types, not automatic_payment_methods
    console.log('Creating SetupIntent...')
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'], // Only specify this, not automatic_payment_methods
      usage: 'off_session',
      metadata: {
        user_id: user.id,
        user_email: email,
        created_by: 'payment_app',
        timestamp: new Date().toISOString()
      }
    })

    console.log('SetupIntent created successfully:', {
      id: setupIntent.id,
      status: setupIntent.status,
      customer: customerId,
      client_secret_present: !!setupIntent.client_secret
    })

    // Verify the SetupIntent was created properly
    if (!setupIntent.client_secret) {
      console.error('SetupIntent created without client_secret')
      throw new Error('Setup intent creation failed - no client secret')
    }

    console.log('=== CREATE SETUP INTENT SUCCESS ===')

    return new Response(JSON.stringify({ 
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
      customer_id: customerId,
      status: setupIntent.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== CREATE SETUP INTENT ERROR ===')
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.type
    })
    
    return new Response(JSON.stringify({ 
      error: error.message,
      code: error.code || 'SETUP_INTENT_ERROR',
      details: 'Failed to create payment setup'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
