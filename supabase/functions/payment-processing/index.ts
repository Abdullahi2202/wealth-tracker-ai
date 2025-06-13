
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { method, url } = req
    const urlObj = new URL(url)
    const action = urlObj.searchParams.get('action')

    switch (method) {
      case 'POST':
        if (action === 'add-payment-method') {
          const { user_id, payment_method_id, set_as_default } = await req.json()
          
          // Retrieve payment method from Stripe
          const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id)
          
          // Store in database
          const { data: storedMethod, error } = await supabase
            .from('stored_payment_methods')
            .insert({
              user_id,
              stripe_payment_method_id: payment_method_id,
              card_brand: paymentMethod.card?.brand,
              card_last4: paymentMethod.card?.last4,
              card_exp_month: paymentMethod.card?.exp_month,
              card_exp_year: paymentMethod.card?.exp_year,
              is_default: set_as_default || false
            })
            .select()
            .single()

          if (error) throw error

          return new Response(JSON.stringify(storedMethod), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (action === 'process-payment') {
          const { user_id, amount, currency = 'usd', description, payment_method_id } = await req.json()
          
          // Create payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            payment_method: payment_method_id,
            confirm: true,
            description,
            return_url: 'https://your-app.com/return'
          })

          // Log transaction
          const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .insert({
              user_id,
              stripe_payment_intent_id: paymentIntent.id,
              amount: Math.round(amount * 100),
              currency,
              status: paymentIntent.status,
              description,
              metadata: { payment_method_id }
            })
            .select()
            .single()

          if (txError) throw txError

          return new Response(JSON.stringify({ transaction, payment_intent: paymentIntent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (action === 'wallet-transaction') {
          const { user_id, amount, transaction_type, description, reference_id } = await req.json()
          
          // Get current wallet balance
          const { data: wallet, error: walletError } = await supabase
            .from('user_wallets')
            .select('balance')
            .eq('user_id', user_id)
            .single()

          if (walletError) throw walletError

          const currentBalance = wallet.balance
          let newBalance = currentBalance

          // Calculate new balance
          if (transaction_type === 'credit') {
            newBalance = currentBalance + Math.round(amount * 100)
          } else if (transaction_type === 'debit') {
            newBalance = currentBalance - Math.round(amount * 100)
            if (newBalance < 0) {
              throw new Error('Insufficient funds')
            }
          }

          // Update wallet balance
          const { error: updateError } = await supabase
            .from('user_wallets')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('user_id', user_id)

          if (updateError) throw updateError

          // Log transaction
          const { data: txLog, error: logError } = await supabase
            .from('transaction_logs')
            .insert({
              user_id,
              transaction_type,
              amount: Math.round(amount * 100),
              balance_before: currentBalance,
              balance_after: newBalance,
              reference_id,
              description
            })
            .select()
            .single()

          if (logError) throw logError

          return new Response(JSON.stringify(txLog), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break

      case 'GET':
        if (action === 'payment-methods') {
          const userId = urlObj.searchParams.get('user_id')
          const { data: methods, error } = await supabase
            .from('stored_payment_methods')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          if (error) throw error

          return new Response(JSON.stringify(methods), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (action === 'wallet-balance') {
          const userId = urlObj.searchParams.get('user_id')
          const { data: wallet, error } = await supabase
            .from('user_wallets')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (error) throw error

          return new Response(JSON.stringify(wallet), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (action === 'transaction-history') {
          const userId = urlObj.searchParams.get('user_id')
          const { data: transactions, error } = await supabase
            .from('transaction_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (error) throw error

          return new Response(JSON.stringify(transactions), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
