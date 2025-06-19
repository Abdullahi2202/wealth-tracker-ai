
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
    console.log('Starting add card process...')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { email, label, setupIntentId } = await req.json()

    console.log('Request data:', { email, label, setupIntentId })

    if (!email || !setupIntentId) {
      throw new Error('Email and setup intent ID are required')
    }

    console.log('Initializing Stripe...')
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    console.log('Retrieving setup intent...', setupIntentId)
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    
    if (setupIntent.status !== 'succeeded') {
      throw new Error('Setup intent not completed successfully')
    }

    if (!setupIntent.payment_method) {
      throw new Error('No payment method attached to setup intent')
    }

    console.log('Retrieving payment method...', setupIntent.payment_method)
    const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string)

    if (!paymentMethod.card) {
      throw new Error('Invalid card payment method')
    }

    console.log('Getting user ID from email...')
    const { data: authUser } = await supabase.auth.admin.getUserByEmail(email)
    if (!authUser.user) {
      throw new Error('User not found')
    }

    console.log('Storing payment method in database...')
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: authUser.user.id,
        stripe_payment_method_id: paymentMethod.id,
        type: 'card',
        brand: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
        label: label || `${paymentMethod.card.brand} **** ${paymentMethod.card.last4}`,
        last4: paymentMethod.card.last4,
        is_active: true,
        is_default: false
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log('Card added successfully!')
    return new Response(JSON.stringify({ success: true, paymentMethod: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error adding card:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.code ? `Stripe error: ${error.code}` : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
