
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { amount, currency = 'usd', description } = await req.json()

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    console.log('Creating payout for user:', user.id, 'amount:', amount)

    // Get user's connect account
    const { data: connectAccount, error: accountError } = await supabase
      .from('connect_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (accountError || !connectAccount) {
      throw new Error('No connect account found. Please set up your account first.')
    }

    if (!connectAccount.payouts_enabled) {
      throw new Error('Payouts not enabled for this account')
    }

    // Check wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      throw new Error('Wallet not found')
    }

    const amountInCents = Math.round(amount * 100)
    if (wallet.balance < amountInCents) {
      throw new Error('Insufficient balance')
    }

    // Create Stripe payout
    const payout = await stripe.payouts.create({
      amount: amountInCents,
      currency: currency,
      description: description || 'Wallet payout',
    }, {
      stripeAccount: connectAccount.stripe_account_id,
    })

    console.log('Stripe payout created:', payout.id)

    // Update wallet balance
    const newBalance = wallet.balance - amountInCents
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update wallet balance:', updateError)
      throw new Error('Failed to update wallet balance')
    }

    // Record payout in database
    const { data: dbPayout, error: dbError } = await supabase
      .from('payouts')
      .insert({
        user_id: user.id,
        stripe_payout_id: payout.id,
        amount: amountInCents,
        currency: currency,
        status: payout.status,
        arrival_date: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
        description: description
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save payout to database')
    }

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        name: 'Payout to Bank Account',
        amount: amount,
        type: 'expense',
        category: 'Payout',
        date: new Date().toISOString().split('T')[0]
      })

    console.log('Payout completed successfully')

    return new Response(JSON.stringify({
      payout: dbPayout,
      new_balance: newBalance / 100
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Create payout error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
