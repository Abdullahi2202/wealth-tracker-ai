
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
    console.log('=== ADD STRIPE CARD START ===')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { email, label, setupIntentId } = await req.json()

    console.log('Processing card addition:', { email, label, setupIntentId })

    if (!email || !setupIntentId) {
      throw new Error('Email and setup intent ID are required')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Retrieve setup intent
    console.log('Retrieving setup intent:', setupIntentId)
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
      expand: ['payment_method']
    })
    
    if (setupIntent.status !== 'succeeded') {
      throw new Error(`Setup intent status is '${setupIntent.status}', expected 'succeeded'`)
    }

    if (!setupIntent.payment_method) {
      throw new Error('No payment method found on setup intent')
    }

    // Get payment method details
    const paymentMethodId = typeof setupIntent.payment_method === 'string' 
      ? setupIntent.payment_method 
      : setupIntent.payment_method.id

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    if (!paymentMethod.card) {
      throw new Error('Only card payment methods are supported')
    }

    console.log('Payment method details:', {
      id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4
    })

    // Get user from registration table
    const { data: users, error: userError } = await supabase
      .from('registration')
      .select('id, email, full_name')
      .eq('email', email)
      .limit(1)

    if (userError) {
      throw new Error(`User lookup failed: ${userError.message}`)
    }

    if (!users || users.length === 0) {
      throw new Error('User not found')
    }

    const user = users[0]
    console.log('Found user:', user.id)

    // Check for existing payment method
    const { data: existingMethod } = await supabase
      .from('payment_methods')
      .select('id, label')
      .eq('stripe_payment_method_id', paymentMethod.id)
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (existingMethod) {
      return new Response(JSON.stringify({ 
        success: true, 
        paymentMethod: existingMethod,
        message: 'This card is already saved'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get customer ID
    const customerId = typeof setupIntent.customer === 'string' 
      ? setupIntent.customer 
      : setupIntent.customer?.id

    // Prepare card data
    const cardLabel = label || `${paymentMethod.card.brand?.toUpperCase()} **** ${paymentMethod.card.last4}`
    
    const cardData = {
      user_id: user.id,
      stripe_payment_method_id: paymentMethod.id,
      stripe_customer_id: customerId,
      type: 'card',
      brand: paymentMethod.card.brand,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      label: cardLabel,
      last4: paymentMethod.card.last4,
      is_active: true,
      is_default: false
    }

    // Save to payment_methods table
    console.log('Saving payment method...')
    const { data: savedMethod, error: saveError } = await supabase
      .from('payment_methods')
      .insert(cardData)
      .select()
      .single()

    if (saveError) {
      throw new Error(`Failed to save payment method: ${saveError.message}`)
    }

    console.log('=== ADD STRIPE CARD SUCCESS ===')

    return new Response(JSON.stringify({ 
      success: true, 
      paymentMethod: savedMethod,
      message: 'Card added successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== ADD STRIPE CARD ERROR ===')
    console.error('Error:', error.message)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'CARD_SAVE_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
