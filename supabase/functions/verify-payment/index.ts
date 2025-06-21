
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
    console.log('Stripe session retrieved:', { id: session.id, payment_status: session.payment_status })

    if (session.payment_status !== 'paid') {
      console.error('Payment not completed:', session.payment_status)
      return new Response(JSON.stringify({ error: 'Payment not completed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find the topup session using the stripe_session_id
    const { data: topupSession, error: fetchError } = await supabase
      .from('topup_sessions')
      .select('*')
      .eq('stripe_session_id', session_id)
      .single()

    if (fetchError || !topupSession) {
      console.error('Error fetching topup session:', fetchError)
      return new Response(JSON.stringify({ error: 'Topup session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Found topup session:', topupSession.id, 'for user:', topupSession.user_id)

    if (topupSession.status === 'completed') {
      console.log('Payment already processed')
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update topup session status
    const { error: updateError } = await supabase
      .from('topup_sessions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', topupSession.id)

    if (updateError) {
      console.error('Error updating topup session:', updateError)
      throw updateError
    }

    console.log('Topup session updated to completed')

    // Update wallet balance using the RPC function
    const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
      user_id_param: topupSession.user_id,
      topup_amount_cents: session.amount_total
    })

    if (walletError) {
      console.error('Error updating wallet balance:', walletError)
      throw walletError
    }

    console.log('Wallet balance updated successfully')

    // Record transaction
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
      message: 'Payment verified and wallet updated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== VERIFY PAYMENT ERROR ===')
    console.error('Error details:', error)
    return new Response(JSON.stringify({ 
      error: 'Payment verification failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
