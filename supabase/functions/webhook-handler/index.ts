
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
            // Add funds to wallet using the wallet-operations function
            try {
              const { data: walletData, error: walletError } = await supabase.functions.invoke('wallet-operations', {
                body: { 
                  action: 'add-funds', 
                  amount: amount,
                  source: 'stripe_topup',
                  description: `Wallet Top-up via Stripe - $${amount}`
                },
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`
                }
              })

              if (walletError) {
                console.error('Error adding funds to wallet:', walletError)
              } else {
                console.log('Successfully added funds to wallet:', walletData)
              }

              // Update topup session status
              await supabase
                .from('topup_sessions')
                .update({ 
                  status: 'completed',
                  processed_at: new Date().toISOString()
                })
                .eq('stripe_session_id', session.id)

            } catch (error) {
              console.error('Error processing wallet topup:', error)
            }
          }
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        
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
        
        // Update payment transaction status
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

      case 'payment_method.attached':
        // Handle when a payment method is successfully attached to a customer
        console.log('Payment method attached:', event.data.object.id)
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
