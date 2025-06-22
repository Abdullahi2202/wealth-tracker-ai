
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
      console.error('STRIPE_SECRET_KEY is missing!')
      throw new Error('Stripe secret key is not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let body;
    try {
      body = await req.json()
    } catch {
      throw new Error('Invalid JSON in request body')
    }

    const { phoneNumber } = body

    console.log('Processing request for phone:', phoneNumber)

    if (!phoneNumber) {
      throw new Error('Phone number is required')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Look up user by phone number in registration table
    const { data: users, error: userError } = await supabase
      .from('registration')
      .select('id, email, full_name, phone')
      .eq('phone', phoneNumber)
      .limit(1)

    if (userError) {
      console.error('User lookup error:', userError)
      throw new Error(`User lookup failed: ${userError.message}`)
    }

    if (!users || users.length === 0) {
      throw new Error('User not found with this phone number. Please ensure you are registered.')
    }

    const user = users[0]
    console.log('Found user:', user.id)

    // Find or create Stripe customer using email
    console.log('Looking for existing Stripe customer...')
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    })
    
    let customerId = customers.data[0]?.id

    if (!customerId) {
      console.log('Creating new Stripe customer')
      const customer = await stripe.customers.create({ 
        email: user.email,
        phone: phoneNumber,
        metadata: {
          user_id: user.id,
          phone: phoneNumber,
          source: 'wallet_app'
        }
      })
      customerId = customer.id
      console.log('Created customer:', customerId)
    } else {
      console.log('Found existing customer:', customerId)
    }

    // Create SetupIntent
    console.log('Creating fresh SetupIntent...')
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        user_id: user.id,
        user_phone: phoneNumber,
        user_email: user.email,
        created_by: 'wallet_app',
        timestamp: new Date().toISOString()
      }
    })

    console.log('SetupIntent created successfully:', {
      id: setupIntent.id,
      status: setupIntent.status,
      customer: customerId,
      has_client_secret: !!setupIntent.client_secret
    })

    if (!setupIntent.client_secret) {
      throw new Error('SetupIntent created without client_secret')
    }

    if (!setupIntent.client_secret.startsWith('seti_')) {
      throw new Error('Invalid client_secret format received')
    }

    console.log('=== CREATE SETUP INTENT SUCCESS ===')

    const response = { 
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
      customer_id: customerId,
      status: setupIntent.status
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== CREATE SETUP INTENT ERROR ===')
    console.error('Error:', error.message)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'SETUP_INTENT_ERROR',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
