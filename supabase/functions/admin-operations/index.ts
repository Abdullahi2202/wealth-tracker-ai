
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { method } = req

    console.log('Admin operations request method:', method)

    switch (method) {
      case 'GET':
        // Default to returning dashboard stats
        console.log('Fetching dashboard statistics...')
        
        // Get comprehensive dashboard statistics
        const [usersResult, walletsResult, transactionsResult, paymentsResult] = await Promise.all([
          supabase.from('users').select('id, created_at, is_verified'),
          supabase.from('user_wallets').select('balance'),
          supabase.from('transaction_logs').select('amount, transaction_type, created_at'),
          supabase.from('payment_transactions').select('amount, status, created_at')
        ])

        const stats = {
          total_users: usersResult.data?.length || 0,
          verified_users: usersResult.data?.filter(u => u.is_verified).length || 0,
          total_wallet_balance: walletsResult.data?.reduce((sum, w) => sum + w.balance, 0) || 0,
          total_transactions: transactionsResult.data?.length || 0,
          total_payments: paymentsResult.data?.length || 0,
          successful_payments: paymentsResult.data?.filter(p => p.status === 'succeeded' || p.status === 'completed').length || 0,
          recent_signups: usersResult.data?.filter(u => 
            new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length || 0
        }

        console.log('Dashboard stats:', stats)
        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'POST':
        const body = await req.json()
        console.log('POST request body:', body)
        const { action } = body

        if (action === 'freeze-user') {
          const { user_id, reason } = body
          
          // Freeze user wallet
          const { error: freezeError } = await supabase
            .from('user_wallets')
            .update({ is_frozen: true })
            .eq('user_id', user_id)

          if (freezeError) throw freezeError

          // Log admin action
          const { error: logError } = await supabase
            .from('admin_activity_logs')
            .insert({
              admin_email: 'admin@system.com', // Replace with actual admin email
              action: 'freeze_user',
              target_table: 'user_wallets',
              target_id: user_id,
              new_values: { is_frozen: true, reason }
            })

          if (logError) console.error('Failed to log admin action:', logError)

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (action === 'verify-user') {
          const { user_id } = body
          
          const { error } = await supabase
            .from('users')
            .update({ is_verified: true, updated_at: new Date().toISOString() })
            .eq('id', user_id)

          if (error) throw error

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (action === 'adjust-balance') {
          const { user_id, amount, reason } = body
          
          // Get current balance
          const { data: wallet, error: walletError } = await supabase
            .from('user_wallets')
            .select('balance')
            .eq('user_id', user_id)
            .single()

          if (walletError) throw walletError

          const newBalance = wallet.balance + Math.round(amount * 100)

          // Update balance
          const { error: updateError } = await supabase
            .from('user_wallets')
            .update({ balance: newBalance })
            .eq('user_id', user_id)

          if (updateError) throw updateError

          // Log transaction
          const { error: logError } = await supabase
            .from('transaction_logs')
            .insert({
              user_id,
              transaction_type: amount > 0 ? 'credit' : 'debit',
              amount: Math.abs(Math.round(amount * 100)),
              balance_before: wallet.balance,
              balance_after: newBalance,
              description: `Admin adjustment: ${reason}`
            })

          if (logError) console.error('Failed to log transaction:', logError)

          return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        break
    }

    return new Response(JSON.stringify({ error: 'Invalid action or method' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin operations error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
