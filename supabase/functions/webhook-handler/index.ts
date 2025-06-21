
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
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig!, webhookSecret!)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Processing webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        
        if (session.metadata?.type === 'wallet_topup') {
          console.log('Processing wallet topup completion:', session.id)
          
          const userId = session.metadata.user_id
          const userEmail = session.metadata.user_email
          const amount = parseFloat(session.metadata.amount || '0')
          
          if (userId && userEmail && amount > 0) {
            console.log('Updating wallet for user:', userEmail, 'amount:', amount)
            
            // Get current wallet balance
            const { data: currentWallet, error: walletFetchError } = await supabase
              .from('wallets')
              .select('balance')
              .eq('user_email', userEmail)
              .single()

            if (walletFetchError) {
              console.error('Error fetching wallet:', walletFetchError)
              break
            }

            const newBalance = Number(currentWallet.balance) + Number(amount)
            console.log('Updating balance from', currentWallet.balance, 'to', newBalance)

            // Update wallet balance
            const { error: walletError } = await supabase
              .from('wallets')
              .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('user_email', userEmail)

            if (walletError) {
              console.error('Error updating wallet:', walletError)
            } else {
              console.log('Wallet updated successfully')
            }

            // Record transaction
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: userEmail,
                name: 'Wallet Top-up',
                amount: Number(amount),
                type: 'income',
                category: 'Top-up',
                date: new Date().toISOString().split('T')[0]
              })

            if (transactionError) {
              console.error('Error recording transaction:', transactionError)
            } else {
              console.log('Transaction recorded successfully')
            }

            // Update topup session status
            const { error: sessionError } = await supabase
              .from('topup_sessions')
              .update({ 
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('stripe_session_id', session.id)

            if (sessionError) {
              console.error('Error updating topup session:', sessionError)
            } else {
              console.log('Topup session updated successfully')
            }
          }
        }
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
        }
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
})
