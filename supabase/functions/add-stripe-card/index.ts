
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
    const { email, label, paymentMethodId } = await req.json()

    console.log('Request data:', { email, label, paymentMethodId })

    if (!email || !paymentMethodId) {
      throw new Error('Email and payment method ID are required')
    }

    console.log('Initializing Stripe with API key...')
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    console.log('Retrieving payment method from Stripe with retry logic...', paymentMethodId)
    
    // Retry logic for retrieving payment method
    let paymentMethod
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        // Progressive delay: 1s, 2s, 3s
        if (retryCount > 0) {
          const delay = retryCount * 1000
          console.log(`Retry attempt ${retryCount}, waiting ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
        console.log('Payment method retrieved successfully:', paymentMethod.id)
        break
        
      } catch (stripeError) {
        console.error(`Stripe error on attempt ${retryCount + 1}:`, stripeError)
        
        if (stripeError.code === 'resource_missing') {
          retryCount++
          if (retryCount >= maxRetries) {
            throw new Error('Payment method not found after multiple attempts. This may be due to network issues or an invalid test card. Please try refreshing the page and using a different card number like 4242424242424242.')
          }
          continue
        }
        
        // For other errors, don't retry
        throw stripeError
      }
    }

    if (!paymentMethod.card) {
      throw new Error('Invalid card payment method')
    }

    // Check if customer exists, create if not
    let customers = await stripe.customers.list({ email, limit: 1 })
    let customerId = customers.data[0]?.id

    if (!customerId) {
      console.log('Creating new Stripe customer...')
      const customer = await stripe.customers.create({ email })
      customerId = customer.id
    }

    console.log('Attaching payment method to customer...')
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    console.log('Getting user ID from email...')
    // Get user ID from email
    const { data: authUser } = await supabase.auth.admin.getUserByEmail(email)
    if (!authUser.user) {
      throw new Error('User not found')
    }

    console.log('Storing payment method in database...')
    // Store payment method details in database
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: authUser.user.id,
        stripe_payment_method_id: paymentMethodId,
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
