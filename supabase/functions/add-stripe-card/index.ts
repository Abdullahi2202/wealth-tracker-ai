
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
      throw new Error(`Setup intent status is ${setupIntent.status}, expected 'succeeded'`)
    }

    if (!setupIntent.payment_method) {
      throw new Error('No payment method attached to setup intent')
    }

    console.log('Retrieving payment method...', setupIntent.payment_method)
    const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string)

    if (!paymentMethod.card) {
      throw new Error('Invalid card payment method')
    }

    console.log('Getting user from auth...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email)
    if (authError || !authUser.user) {
      console.error('Auth error:', authError)
      throw new Error('User not found or authentication failed')
    }

    console.log('Found user:', authUser.user.id)

    // Check if this payment method already exists
    const { data: existingMethod } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('stripe_payment_method_id', paymentMethod.id)
      .eq('user_id', authUser.user.id)
      .single()
    
    if (existingMethod) {
      console.log('Payment method already exists, returning existing record')
      return new Response(JSON.stringify({ 
        success: true, 
        paymentMethod: existingMethod,
        message: 'Card already exists in your account'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
        label: label || `${paymentMethod.card.brand?.toUpperCase()} **** ${paymentMethod.card.last4}`,
        last4: paymentMethod.card.last4,
        is_active: true,
        is_default: false
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('Card added successfully!', data)
    return new Response(JSON.stringify({ 
      success: true, 
      paymentMethod: data,
      message: 'Card added successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error adding card:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.code ? `Stripe error: ${error.code}` : 'Server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
