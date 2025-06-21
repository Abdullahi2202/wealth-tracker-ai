
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
  console.log('Request URL:', req.url)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    console.log('Webhook body length:', body.length)
    console.log('Stripe signature present:', !!sig)
    console.log('Webhook secret configured:', !!webhookSecret)

    let event
    try {
      if (webhookSecret && sig) {
        console.log('Verifying webhook signature...')
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
        console.log('Webhook signature verified successfully')
      } else {
        console.log('No webhook secret configured or no signature, parsing body directly')
        event = JSON.parse(body)
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Processing webhook event:', event.type)
    console.log('Event ID:', event.id)
    console.log('Event data keys:', Object.keys(event.data?.object || {}))

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        console.log('=== CHECKOUT SESSION COMPLETED ===')
        console.log('Session ID:', session.id)
        console.log('Session metadata:', session.metadata)
        console.log('Session mode:', session.mode)
        console.log('Session payment_status:', session.payment_status)
        
        // Find the topup session by stripe_session_id
        console.log('Looking for topup session with stripe_session_id:', session.id)
        const { data: topupSession, error: sessionError } = await supabase
          .from('topup_sessions')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single()

        if (sessionError || !topupSession) {
          console.error('Topup session not found:', sessionError)
          console.log('Available topup sessions:')
          const { data: allSessions } = await supabase
            .from('topup_sessions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
          console.log(allSessions)
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
        console.log('Payment intent succeeded - not handling for topups')
        break

      case 'payment_intent.payment_failed':
        console.log('Payment intent failed - not handling for topups')
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    console.log('=== WEBHOOK PROCESSING COMPLETED ===')
    return new Response(JSON.stringify({ received: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('=== WEBHOOK PROCESSING ERROR ===')
    console.error('Error details:', error)
    console.error('Error stack:', error.stack)
    return new Response(JSON.stringify({ error: 'Webhook processing failed', details: error.message }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})
