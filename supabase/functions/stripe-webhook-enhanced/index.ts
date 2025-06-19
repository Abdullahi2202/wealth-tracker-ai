
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
        console.log('Checkout session completed:', session.id)

        // Get session details
        const { data: topupSession, error: sessionError } = await supabase
          .from('topup_sessions')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single()

        if (sessionError || !topupSession) {
          console.error('Topup session not found:', sessionError)
          break
        }

        // Update session status
        await supabase
          .from('topup_sessions')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_session_id', session.id)

        // Update wallet balance
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', topupSession.user_id)
          .single()

        if (!walletError && wallet) {
          const newBalance = Number(wallet.balance) + Number(topupSession.amount)
          
          await supabase
            .from('wallets')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', topupSession.user_id)

          // Record transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: topupSession.user_id,
              name: 'Wallet Top-up',
              amount: topupSession.amount / 100,
              type: 'income',
              category: 'Top-up',
              date: new Date().toISOString().split('T')[0]
            })

          console.log('Wallet topped up successfully for user:', topupSession.user_id)
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('Payment intent succeeded:', paymentIntent.id)
        
        // Update payment transaction status
        await supabase
          .from('payment_transactions')
          .update({ 
            status: 'succeeded',
            processed_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('Payment intent failed:', failedPayment.id)
        
        await supabase
          .from('payment_transactions')
          .update({ 
            status: 'failed',
            processed_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', failedPayment.id)
        break

      case 'payout.paid':
        const payout = event.data.object
        console.log('Payout paid:', payout.id)
        
        await supabase
          .from('payouts')
          .update({ 
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payout_id', payout.id)
        break

      case 'payout.failed':
        const failedPayout = event.data.object
        console.log('Payout failed:', failedPayout.id)
        
        // Update payout status
        await supabase
          .from('payouts')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payout_id', failedPayout.id)

        // Refund the amount back to user's wallet
        const { data: payoutRecord } = await supabase
          .from('payouts')
          .select('user_id, amount')
          .eq('stripe_payout_id', failedPayout.id)
          .single()

        if (payoutRecord) {
          const { data: userWallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', payoutRecord.user_id)
            .single()

          if (userWallet) {
            const refundBalance = Number(userWallet.balance) + Number(payoutRecord.amount)
            
            await supabase
              .from('wallets')
              .update({ 
                balance: refundBalance,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', payoutRecord.user_id)

            // Record refund transaction
            await supabase
              .from('transactions')
              .insert({
                user_id: payoutRecord.user_id,
                name: 'Payout Failed - Refund',
                amount: payoutRecord.amount / 100,
                type: 'income',
                category: 'Refund',
                date: new Date().toISOString().split('T')[0]
              })
          }
        }
        break

      case 'account.updated':
        const account = event.data.object
        console.log('Account updated:', account.id)
        
        await supabase
          .from('connect_accounts')
          .update({
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_account_id', account.id)
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
