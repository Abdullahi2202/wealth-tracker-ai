
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
})

Deno.serve(async (req) => {
  console.log('=== WEBHOOK HANDLER STARTED ===')
  console.log('Request method:', req.method)
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    console.log('Webhook body length:', body.length)
    console.log('Stripe signature present:', !!sig)

    let event
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, sig!, webhookSecret)
        console.log('Webhook signature verified successfully')
      } else {
        console.log('No webhook secret configured, parsing body directly')
        event = JSON.parse(body)
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Processing webhook event:', event.type)
    console.log('Event ID:', event.id)

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        console.log('=== CHECKOUT SESSION COMPLETED ===')
        console.log('Session ID:', session.id)
        console.log('Session metadata:', session.metadata)
        
        // Find the topup session by stripe_session_id
        console.log('Looking for topup session with stripe_session_id:', session.id)
        const { data: topupSession, error: sessionError } = await supabase
          .from('topup_sessions')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single()

        if (sessionError || !topupSession) {
          console.error('Topup session not found:', sessionError)
          break
        }

        console.log('Found topup session:', topupSession)

        // Update topup session status to completed
        console.log('Updating topup session status to completed')
        const { error: updateSessionError } = await supabase
          .from('topup_sessions')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', topupSession.id)

        if (updateSessionError) {
          console.error('Error updating topup session:', updateSessionError)
        } else {
          console.log('Topup session updated successfully')
        }

        // Get user info
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(topupSession.user_id)
        if (userError || !userData.user) {
          console.error('Error getting user:', userError)
          break
        }

        const userEmail = userData.user.email
        console.log('Processing topup for user:', userEmail)

        // Update wallet balance using the RPC function
        console.log('Updating wallet balance using RPC function')
        const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
          user_id_param: topupSession.user_id,
          topup_amount_cents: topupSession.amount
        })

        if (walletError) {
          console.error('Error updating wallet balance:', walletError)
        } else {
          console.log('Wallet balance updated successfully')
        }

        // Record transaction
        console.log('Recording transaction')
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: topupSession.user_id,
            name: 'Wallet Top-up',
            amount: topupSession.amount / 100,
            type: 'income',
            category: 'Top-up',
            date: new Date().toISOString().split('T')[0],
            status: 'completed'
          })

        if (transactionError) {
          console.error('Error recording transaction:', transactionError)
        } else {
          console.log('Transaction recorded successfully')
        }

        console.log('=== WALLET TOPUP COMPLETED SUCCESSFULLY ===')
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('Payment intent succeeded:', paymentIntent.id)
        
        // Update payment transaction status
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({ 
            status: 'succeeded',
            processed_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (updateError) {
          console.error('Error updating payment transaction:', updateError)
        } else {
          console.log('Payment transaction updated successfully')
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('Payment intent failed:', failedPayment.id)
        
        const { error: failError } = await supabase
          .from('payment_transactions')
          .update({ 
            status: 'failed',
            processed_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', failedPayment.id)

        if (failError) {
          console.error('Error updating failed payment:', failError)
        } else {
          console.log('Failed payment updated successfully')
        }
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    console.log('=== WEBHOOK PROCESSING COMPLETED ===')
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== WEBHOOK PROCESSING ERROR ===')
    console.error('Error details:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
})
