
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
    
    if (!stripeKey || !supabaseServiceKey) {
      console.error('Required environment variables not configured')
      throw new Error('Payment system not properly configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { email, label, setupIntentId } = await req.json()

    console.log('Processing card addition:', { 
      email, 
      label, 
      setupIntentId,
      timestamp: new Date().toISOString()
    })

    if (!email || !setupIntentId) {
      throw new Error('Email and setup intent ID are required')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      timeout: 15000, // 15 second timeout
    })

    // Add delay before retrieving setup intent to ensure it's available
    console.log('Waiting before retrieving setup intent...')
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay

    // Retrieve and validate setup intent with retries
    console.log('Retrieving setup intent from Stripe:', setupIntentId)
    let setupIntent;
    let retries = 3;
    
    while (retries > 0) {
      try {
        setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
          expand: ['payment_method']
        })
        console.log('Setup intent retrieved:', {
          id: setupIntent.id,
          status: setupIntent.status,
          customer: setupIntent.customer,
          payment_method_id: setupIntent.payment_method?.id || 'none'
        })
        break
      } catch (stripeError) {
        retries--
        console.error(`Stripe API error (${3 - retries} attempts):`, {
          message: stripeError.message,
          code: stripeError.code,
          type: stripeError.type,
          setup_intent_id: setupIntentId
        })
        
        if (retries === 0) {
          throw new Error(`Setup intent retrieval failed after 3 attempts: ${stripeError.message}`)
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    if (setupIntent.status !== 'succeeded') {
      console.error('Setup intent not in succeeded status:', {
        status: setupIntent.status,
        id: setupIntentId
      })
      throw new Error(`Setup intent status is '${setupIntent.status}', expected 'succeeded'. Please try adding your card again.`)
    }

    if (!setupIntent.payment_method) {
      console.error('No payment method attached to setup intent')
      throw new Error('No payment method found on setup intent')
    }

    // Get payment method details
    console.log('Retrieving payment method details...')
    const paymentMethodId = typeof setupIntent.payment_method === 'string' 
      ? setupIntent.payment_method 
      : setupIntent.payment_method.id

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    if (!paymentMethod.card) {
      console.error('Payment method is not a card:', paymentMethod.type)
      throw new Error('Only card payment methods are supported')
    }

    console.log('Payment method details:', {
      id: paymentMethod.id,
      type: paymentMethod.type,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      country: paymentMethod.card.country,
      funding: paymentMethod.card.funding
    })

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
    console.log('Found user:', user.id)

    // Check for existing payment method
    const { data: existingMethod } = await supabase
      .from('payment_methods')
      .select('id, label')
      .eq('stripe_payment_method_id', paymentMethod.id)
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (existingMethod) {
      console.log('Payment method already exists:', existingMethod.id)
      return new Response(JSON.stringify({ 
        success: true, 
        paymentMethod: existingMethod,
        message: 'This card is already saved to your account'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get customer ID from setup intent
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

    // Save to main payment_methods table
    console.log('Saving payment method to database...')
    const { data: savedMethod, error: saveError } = await supabase
      .from('payment_methods')
      .insert(cardData)
      .select()
      .single()

    if (saveError) {
      console.error('Error saving to payment_methods:', saveError)
      throw new Error(`Failed to save payment method: ${saveError.message}`)
    }

    // Also save to stripe_test_cards table for testing/retrieval purposes
    console.log('Saving to stripe_test_cards table...')
    const testCardData = {
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_payment_method_id: paymentMethod.id,
      stripe_setup_intent_id: setupIntent.id,
      card_brand: paymentMethod.card.brand,
      card_last4: paymentMethod.card.last4,
      card_exp_month: paymentMethod.card.exp_month,
      card_exp_year: paymentMethod.card.exp_year,
      label: cardLabel,
      is_test: true,
      status: 'active'
    }

    const { data: testCard, error: testCardError } = await supabase
      .from('stripe_test_cards')
      .insert(testCardData)
      .select()
      .single()

    if (testCardError) {
      console.warn('Warning: Failed to save to test cards table:', testCardError)
      // Don't fail the whole operation for this
    } else {
      console.log('Test card saved successfully:', testCard.id)
    }

    console.log('=== ADD STRIPE CARD SUCCESS ===')
    console.log('Card saved successfully:', {
      payment_method_id: savedMethod.id,
      test_card_id: testCard?.id,
      label: savedMethod.label,
      brand: savedMethod.brand,
      last4: savedMethod.last4
    })

    return new Response(JSON.stringify({ 
      success: true, 
      paymentMethod: savedMethod,
      testCard: testCard,
      message: 'Card added successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== ADD STRIPE CARD ERROR ===')
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.type,
      timestamp: new Date().toISOString()
    })
    
    return new Response(JSON.stringify({ 
      error: error.message,
      code: error.code || 'CARD_SAVE_ERROR',
      details: 'Failed to save payment method'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
