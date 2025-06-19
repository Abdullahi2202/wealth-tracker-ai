
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
    const { method, url } = req
    const urlObj = new URL(url)
    const action = urlObj.searchParams.get('action')

    // Verify admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      throw new Error('Admin access required')
    }

    console.log('Admin action requested:', action, 'by user:', user.id)

    switch (action) {
      case 'get-all-transactions':
        const { data: allTransactions, error: transError } = await supabase
          .from('payment_transactions')
          .select(`
            *,
            profiles!inner(email, full_name)
          `)
          .order('created_at', { ascending: false })

        if (transError) throw transError

        return new Response(JSON.stringify(allTransactions), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'get-all-transfers':
        const { data: allTransfers, error: transferError } = await supabase
          .from('money_transfers')
          .select(`
            *,
            sender:profiles!money_transfers_sender_id_fkey(email, full_name),
            recipient:profiles!money_transfers_recipient_id_fkey(email, full_name)
          `)
          .order('created_at', { ascending: false })

        if (transferError) throw transferError

        return new Response(JSON.stringify(allTransfers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'get-all-payouts':
        const { data: allPayouts, error: payoutError } = await supabase
          .from('payouts')
          .select(`
            *,
            profiles!inner(email, full_name)
          `)
          .order('created_at', { ascending: false })

        if (payoutError) throw payoutError

        return new Response(JSON.stringify(allPayouts), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'get-all-topups':
        const { data: allTopups, error: topupError } = await supabase
          .from('topup_sessions')
          .select(`
            *,
            profiles!inner(email, full_name)
          `)
          .order('created_at', { ascending: false })

        if (topupError) throw topupError

        return new Response(JSON.stringify(allTopups), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'get-connect-accounts':
        const { data: connectAccounts, error: connectError } = await supabase
          .from('connect_accounts')
          .select(`
            *,
            profiles!inner(email, full_name)
          `)
          .order('created_at', { ascending: false })

        if (connectError) throw connectError

        return new Response(JSON.stringify(connectAccounts), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'get-wallet-stats':
        const { data: walletStats, error: statsError } = await supabase
          .from('wallets')
          .select(`
            *,
            profiles!inner(email, full_name)
          `)
          .order('balance', { ascending: false })

        if (statsError) throw statsError

        // Calculate totals
        const totalBalance = walletStats.reduce((sum, wallet) => sum + Number(wallet.balance), 0)
        const activeWallets = walletStats.filter(w => !w.is_frozen).length
        const frozenWallets = walletStats.filter(w => w.is_frozen).length

        return new Response(JSON.stringify({
          wallets: walletStats,
          stats: {
            total_balance: totalBalance / 100,
            total_wallets: walletStats.length,
            active_wallets: activeWallets,
            frozen_wallets: frozenWallets
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'freeze-wallet':
        const { user_id: freezeUserId } = await req.json()
        
        const { error: freezeError } = await supabase
          .from('wallets')
          .update({ 
            is_frozen: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', freezeUserId)

        if (freezeError) throw freezeError

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'unfreeze-wallet':
        const { user_id: unfreezeUserId } = await req.json()
        
        const { error: unfreezeError } = await supabase
          .from('wallets')
          .update({ 
            is_frozen: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', unfreezeUserId)

        if (unfreezeError) throw unfreezeError

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Admin payment management error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
