
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

    const { recipient_email, amount, currency = 'usd', description } = await req.json()

    if (!recipient_email || !amount || amount <= 0) {
      throw new Error('Invalid recipient email or amount')
    }

    console.log('Sending money from user:', user.id, 'to:', recipient_email, 'amount:', amount)

    const amountInCents = Math.round(amount * 100)

    // Get sender's wallet
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (senderWalletError || !senderWallet) {
      throw new Error('Sender wallet not found')
    }

    if (senderWallet.balance < amountInCents) {
      throw new Error('Insufficient balance')
    }

    // Get recipient user
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', recipient_email)
      .single()

    if (recipientError || !recipientProfile) {
      throw new Error('Recipient not found')
    }

    // Get recipient's wallet
    const { data: recipientWallet, error: recipientWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', recipientProfile.id)
      .single()

    if (recipientWalletError || !recipientWallet) {
      throw new Error('Recipient wallet not found')
    }

    // Check if both users have connect accounts for Stripe transfer
    const { data: senderConnect } = await supabase
      .from('connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    const { data: recipientConnect } = await supabase
      .from('connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', recipientProfile.id)
      .single()

    let stripeTransferId = null

    // If both have connect accounts, create Stripe transfer
    if (senderConnect && recipientConnect) {
      try {
        const transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: currency,
          destination: recipientConnect.stripe_account_id,
          description: description || `Transfer from ${user.email}`,
          metadata: {
            sender_id: user.id,
            recipient_id: recipientProfile.id
          }
        })
        stripeTransferId = transfer.id
        console.log('Stripe transfer created:', transfer.id)
      } catch (stripeError) {
        console.error('Stripe transfer failed:', stripeError)
        // Continue with internal transfer even if Stripe fails
      }
    }

    // Update balances
    const newSenderBalance = senderWallet.balance - amountInCents
    const newRecipientBalance = recipientWallet.balance + amountInCents

    // Update sender wallet
    const { error: senderUpdateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newSenderBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)

    if (senderUpdateError) {
      throw new Error('Failed to update sender balance')
    }

    // Update recipient wallet
    const { error: recipientUpdateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newRecipientBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', recipientProfile.id)

    if (recipientUpdateError) {
      throw new Error('Failed to update recipient balance')
    }

    // Record money transfer
    const { data: transfer, error: transferError } = await supabase
      .from('money_transfers')
      .insert({
        sender_id: user.id,
        recipient_id: recipientProfile.id,
        amount: amountInCents,
        currency: currency,
        status: 'completed',
        stripe_transfer_id: stripeTransferId,
        description: description
      })
      .select()
      .single()

    if (transferError) {
      console.error('Failed to record transfer:', transferError)
      throw new Error('Failed to record transfer')
    }

    // Record transactions for both users
    await Promise.all([
      // Sender transaction
      supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: `Money sent to ${recipient_email}`,
          amount: amount,
          type: 'expense',
          category: 'Transfer',
          date: new Date().toISOString().split('T')[0]
        }),
      
      // Recipient transaction
      supabase
        .from('transactions')
        .insert({
          user_id: recipientProfile.id,
          name: `Money received from ${user.email}`,
          amount: amount,
          type: 'income',
          category: 'Transfer',
          date: new Date().toISOString().split('T')[0]
        })
    ])

    console.log('Money transfer completed successfully')

    return new Response(JSON.stringify({
      transfer: transfer,
      sender_new_balance: newSenderBalance / 100,
      recipient_new_balance: newRecipientBalance / 100,
      stripe_transfer_id: stripeTransferId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Send money error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
