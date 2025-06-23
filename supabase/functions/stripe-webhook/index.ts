
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  console.log('=== STRIPE WEBHOOK HANDLER STARTED ===')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const sig = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    console.log('Webhook signature present:', !!sig)
    console.log('Body length:', body.length)

    let event
    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
        console.log('Webhook signature verified successfully')
      } else {
        console.log('No webhook secret configured, parsing body directly')
        event = JSON.parse(body)
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log('Processing webhook event:', event.type)
    console.log('Event ID:', event.id)

    // Handle checkout session completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('=== CHECKOUT SESSION COMPLETED ===')
      console.log('Session ID:', session.id)
      console.log('Session metadata:', session.metadata)
      
      if (session.metadata?.type === 'wallet_topup') {
        console.log('Processing wallet topup completion')
        
        const userId = session.metadata.user_id
        const userPhone = session.metadata.phone
        const amountInCents = session.amount_total
        
        console.log('Topup details:', {
          userId,
          userPhone,
          amountInCents
        })
        
        if (userId && amountInCents > 0) {
          // Update topup session status to completed
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
            console.log('Topup session updated successfully - wallet balance will be updated by trigger')
          }

          // Record transaction for tracking
          console.log('Recording transaction')
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              name: 'Wallet Top-up',
              amount: amountInCents / 100,
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
            amountInCents
          })
        }
      } else {
        console.log('Session metadata type is not wallet_topup:', session.metadata?.type)
      }
    } else {
      console.log('Unhandled event type:', event.type)
    }

    console.log('=== WEBHOOK PROCESSING COMPLETED ===')
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== WEBHOOK PROCESSING ERROR ===')
    console.error('Error details:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
})
