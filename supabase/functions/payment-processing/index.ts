
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
          let body
          try {
            body = await req.json()
          } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          const { phoneNumber, payment_method_id, set_as_default } = body

          if (!phoneNumber || !payment_method_id) {
            return new Response(JSON.stringify({ error: 'Missing phoneNumber or payment_method_id' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          // Look up user by phone number in registration table
          const { data: users, error: userError } = await supabase
            .from('registration')
            .select('id, email, full_name, phone')
            .eq('phone', phoneNumber)
            .limit(1)

          if (userError) {
            console.error('User lookup error:', userError)
            return new Response(JSON.stringify({ error: `User lookup failed: ${userError.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          if (!users || users.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found with this phone number' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            })
          }

          const user = users[0]
          
          // Retrieve payment method from Stripe
          const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id)
          
          // Store in database
          const { data: storedMethod, error } = await supabase
            .from('payment_methods')
            .insert({
              user_id: user.id,
              stripe_payment_method_id: payment_method_id,
              type: 'card',
              brand: paymentMethod.card?.brand,
              last4: paymentMethod.card?.last4,
              exp_month: paymentMethod.card?.exp_month,
              exp_year: paymentMethod.card?.exp_year,
              is_default: set_as_default || false
            })
            .select()
            .single()

          if (error) {
            console.error('Payment method storage error:', error)
            return new Response(JSON.stringify({ error: `Failed to store payment method: ${error.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            })
          }

          return new Response(JSON.stringify(storedMethod), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }

        if (action === 'process-payment') {
          let body
          try {
            body = await req.json()
          } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          const { phoneNumber, amount, currency = 'usd', description, payment_method_id } = body
          
          if (!phoneNumber || !amount || !payment_method_id) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          // Look up user by phone number
          const { data: users, error: userError } = await supabase
            .from('registration')
            .select('id')
            .eq('phone', phoneNumber)
            .limit(1)

          if (userError || !users || users.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            })
          }

          const user_id = users[0].id
          
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

          if (txError) {
            console.error('Transaction logging error:', txError)
            return new Response(JSON.stringify({ error: `Transaction logging failed: ${txError.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            })
          }

          return new Response(JSON.stringify({ transaction, payment_intent: paymentIntent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }

        if (action === 'wallet-transaction') {
          let body
          try {
            body = await req.json()
          } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          const { phoneNumber, amount, transaction_type, description, reference_id } = body
          
          if (!phoneNumber || !amount || !transaction_type) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          // Look up user by phone number
          const { data: users, error: userError } = await supabase
            .from('registration')
            .select('id')
            .eq('phone', phoneNumber)
            .limit(1)

          if (userError || !users || users.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            })
          }

          const user_id = users[0].id
          
          // Get current wallet balance
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user_id)
            .single()

          if (walletError) {
            console.error('Wallet lookup error:', walletError)
            return new Response(JSON.stringify({ error: `Wallet lookup failed: ${walletError.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            })
          }

          const currentBalance = wallet.balance
          let newBalance = currentBalance

          // Calculate new balance
          if (transaction_type === 'credit') {
            newBalance = currentBalance + Math.round(amount * 100)
          } else if (transaction_type === 'debit') {
            newBalance = currentBalance - Math.round(amount * 100)
            if (newBalance < 0) {
              return new Response(JSON.stringify({ error: 'Insufficient funds' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
              })
            }
          }

          // Update wallet balance
          const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('user_id', user_id)

          if (updateError) {
            console.error('Wallet update error:', updateError)
            return new Response(JSON.stringify({ error: `Wallet update failed: ${updateError.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            })
          }

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

          if (logError) {
            console.error('Transaction log error:', logError)
            return new Response(JSON.stringify({ error: `Transaction logging failed: ${logError.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            })
          }

          return new Response(JSON.stringify(txLog), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })

      case 'GET':
        if (action === 'payment-methods') {
          const phoneNumber = urlObj.searchParams.get('phoneNumber')
          
          if (!phoneNumber) {
            return new Response(JSON.stringify({ error: 'Missing phoneNumber parameter' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          // Look up user by phone number
          const { data: users, error: userError } = await supabase
            .from('registration')
            .select('id')
            .eq('phone', phoneNumber)
            .limit(1)

          if (userError || !users || users.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            })
          }

          const user_id = users[0].id

          const { data: methods, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', user_id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Payment methods fetch error:', error)
            return new Response(JSON.stringify({ error: `Failed to fetch payment methods: ${error.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            })
          }

          return new Response(JSON.stringify(methods), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }

        if (action === 'wallet-balance') {
          const phoneNumber = urlObj.searchParams.get('phoneNumber')
          
          if (!phoneNumber) {
            return new Response(JSON.stringify({ error: 'Missing phoneNumber parameter' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          // Look up user by phone number
          const { data: users, error: userError } = await supabase
            .from('registration')
            .select('id')
            .eq('phone', phoneNumber)
            .limit(1)

          if (userError || !users || users.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            })
          }

          const user_id = users[0].id

          const { data: wallet, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user_id)
            .single()

          if (error) {
            console.error('Wallet fetch error:', error)
            return new Response(JSON.stringify({ error: `Failed to fetch wallet: ${error.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            })
          }

          return new Response(JSON.stringify(wallet), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }

        if (action === 'transaction-history') {
          const phoneNumber = urlObj.searchParams.get('phoneNumber')
          
          if (!phoneNumber) {
            return new Response(JSON.stringify({ error: 'Missing phoneNumber parameter' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          }

          // Look up user by phone number
          const { data: users, error: userError } = await supabase
            .from('registration')
            .select('id')
            .eq('phone', phoneNumber)
            .limit(1)

          if (userError || !users || users.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            })
          }

          const user_id = users[0].id

          const { data: transactions, error } = await supabase
            .from('transaction_logs')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Transaction history fetch error:', error)
            return new Response(JSON.stringify({ error: `Failed to fetch transaction history: ${error.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            })
          }

          return new Response(JSON.stringify(transactions), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        })
    }
  } catch (e) {
    console.error('Unhandled error:', e)
    return new Response(JSON.stringify({ error: 'Internal server error', details: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
