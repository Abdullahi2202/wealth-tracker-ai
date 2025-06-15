
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { email, label, paymentMethodId } = await req.json()

    if (!email || !paymentMethodId) {
      throw new Error('Email and payment method ID are required')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Retrieve the payment method from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    if (!paymentMethod.card) {
      throw new Error('Invalid card payment method')
    }

    // Check if customer exists, create if not
    let customers = await stripe.customers.list({ email, limit: 1 })
    let customerId = customers.data[0]?.id

    if (!customerId) {
      const customer = await stripe.customers.create({ email })
      customerId = customer.id
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Store payment method details in database
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_email: email,
        stripe_payment_method_id: paymentMethodId,
        type: 'card',
        brand: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
        label: label || `${paymentMethod.card.brand} **** ${paymentMethod.card.last4}`,
        details: {
          last4: paymentMethod.card.last4,
          funding: paymentMethod.card.funding,
          country: paymentMethod.card.country
        }
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, paymentMethod: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error adding card:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
