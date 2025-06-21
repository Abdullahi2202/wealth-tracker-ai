
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
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  
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
        
        if (session.metadata?.type === 'wallet_topup') {
          console.log('Processing wallet topup completion')
          
          const userId = session.metadata.user_id
          const userEmail = session.metadata.user_email
          const amountInCents = parseInt(session.metadata.amount_cents || '0')
          const amountInDollars = amountInCents / 100
          
          console.log('Topup details:', {
            userId,
            userEmail,
            amountInCents,
            amountInDollars
          })
          
          if (userId && userEmail && amountInCents > 0) {
            // Update topup session status first
            console.log('Updating topup session status to completed')
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

            // Get current wallet balance
            console.log('Fetching current wallet balance for:', userEmail)
            const { data: currentWallet, error: walletFetchError } = await supabase
              .from('wallets')
              .select('balance')
              .eq('user_email', userEmail)
              .single()

            if (walletFetchError) {
              console.error('Error fetching wallet:', walletFetchError)
              break
            }

            const currentBalance = Number(currentWallet.balance) || 0
            const newBalance = currentBalance + amountInDollars
            
            console.log('Balance update:', {
              currentBalance,
              amountInDollars,
              newBalance
            })

            // Update wallet balance
            console.log('Updating wallet balance')
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
              console.log('Wallet updated successfully from', currentBalance, 'to', newBalance)
            }

            // Record transaction
            console.log('Recording transaction')
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: userId,
                name: 'Wallet Top-up',
                amount: amountInDollars,
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
          } else {
            console.error('Missing required data for wallet topup:', {
              userId: !!userId,
              userEmail: !!userEmail,
              amountInCents
            })
          }
        } else {
          console.log('Session metadata type is not wallet_topup:', session.metadata?.type)
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
