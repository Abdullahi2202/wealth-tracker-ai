
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('=== MANUAL WEBHOOK TEST ===')

    // Get the pending topup session
    const { data: pendingSession, error: sessionError } = await supabase
      .from('topup_sessions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !pendingSession) {
      console.error('No pending session found:', sessionError)
      return new Response(JSON.stringify({ error: 'No pending session found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Found pending session:', pendingSession)

    // Update to completed
    const { error: updateError } = await supabase
      .from('topup_sessions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingSession.id)

    if (updateError) {
      console.error('Error updating session:', updateError)
      throw updateError
    }

    // Update wallet balance
    const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
      user_id_param: pendingSession.user_id,
      topup_amount_cents: pendingSession.amount
    })

    if (walletError) {
      console.error('Error updating wallet:', walletError)
      throw walletError
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: pendingSession.user_id,
        name: 'Wallet Top-up (Manual)',
        amount: pendingSession.amount / 100,
        type: 'income',
        category: 'Top-up',
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
    }

    console.log('=== MANUAL PROCESSING COMPLETED ===')
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Pending topup processed successfully',
      session: pendingSession
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Manual webhook test error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
