
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
  console.log('=== VERIFY PAYMENT STARTED ===')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const body = await req.json()
    const { session_id } = body

    console.log('Request body received:', { session_id })

    if (!session_id) {
      console.error('Missing session_id')
      return new Response(JSON.stringify({ error: 'Missing session_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Verifying payment for session:', session_id)

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id)
    console.log('Stripe session retrieved:', { 
      id: session.id, 
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      customer: session.customer,
      metadata: session.metadata
    })

    if (session.payment_status !== 'paid') {
      console.error('Payment not completed:', session.payment_status)
      return new Response(JSON.stringify({ 
        error: 'Payment not completed', 
        payment_status: session.payment_status 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find the topup session using the stripe_session_id
    console.log('Looking for topup session with stripe_session_id:', session_id)
    const { data: topupSession, error: fetchError } = await supabase
      .from('topup_sessions')
      .select('*')
      .eq('stripe_session_id', session_id)
      .single()

    console.log('Topup session query result:', { topupSession, fetchError })

    if (fetchError || !topupSession) {
      console.error('Error fetching topup session:', fetchError)
      return new Response(JSON.stringify({ 
        error: 'Topup session not found',
        details: fetchError?.message || 'Session not found in database'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Found topup session:', topupSession.id, 'for user:', topupSession.user_id, 'status:', topupSession.status)

    // Update wallet balance using the RPC function
    console.log('Updating wallet balance for user:', topupSession.user_id, 'amount:', session.amount_total)
    const { data: rpcResult, error: walletError } = await supabase.rpc('increment_wallet_balance', {
      user_id_param: topupSession.user_id,
      topup_amount_cents: session.amount_total
    })

    console.log('RPC function result:', { rpcResult, walletError })

    if (walletError) {
      console.error('Error updating wallet balance:', walletError)
      return new Response(JSON.stringify({ 
        error: 'Failed to update wallet balance',
        details: walletError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Wallet balance updated successfully')

    // Record transaction
    console.log('Recording transaction')
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: topupSession.user_id,
        name: 'Wallet Top-up',
        amount: session.amount_total / 100,
        type: 'income',
        category: 'Top-up',
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // Don't throw here, transaction recording is not critical
    } else {
      console.log('Transaction recorded successfully')
    }

    console.log('=== PAYMENT VERIFICATION COMPLETED ===')
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Payment verified and wallet updated',
      amount: session.amount_total / 100,
      session_id: session_id,
      wallet_updated: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== VERIFY PAYMENT ERROR ===')
    console.error('Error details:', error)
    return new Response(JSON.stringify({ 
      error: 'Payment verification failed',
      details: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
