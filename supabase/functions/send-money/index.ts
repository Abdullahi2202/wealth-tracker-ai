
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

    const { recipient_phone, recipient_email, amount, description } = await req.json()

    if ((!recipient_phone && !recipient_email) || !amount || amount <= 0) {
      throw new Error('Invalid recipient or amount')
    }

    console.log('Sending money from user:', user.id, 'to:', recipient_phone || recipient_email, 'amount:', amount)

    const amountInCents = Math.round(amount * 100)

    // Get sender's profile and wallet
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()

    const senderPhone = senderProfile?.phone

    // Get sender's wallet (try by phone first, then email)
    let senderWalletQuery = supabase.from('wallets').select('*')
    if (senderPhone) {
      senderWalletQuery = senderWalletQuery.eq('user_phone', senderPhone)
    } else {
      senderWalletQuery = senderWalletQuery.eq('user_email', user.email)
    }

    const { data: senderWallet, error: senderWalletError } = await senderWalletQuery.single()

    if (senderWalletError || !senderWallet) {
      throw new Error('Sender wallet not found')
    }

    if (senderWallet.balance < amountInCents) {
      throw new Error('Insufficient balance')
    }

    // Find recipient by phone or email
    let recipientProfile = null
    if (recipient_phone) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, phone')
        .eq('phone', recipient_phone)
        .single()
      recipientProfile = data
    } else if (recipient_email) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, phone')
        .eq('email', recipient_email)
        .single()
      recipientProfile = data
    }

    if (!recipientProfile) {
      throw new Error('Recipient not found')
    }

    // Get recipient's wallet
    let recipientWalletQuery = supabase.from('wallets').select('*')
    if (recipientProfile.phone) {
      recipientWalletQuery = recipientWalletQuery.eq('user_phone', recipientProfile.phone)
    } else {
      recipientWalletQuery = recipientWalletQuery.eq('user_email', recipientProfile.email)
    }

    const { data: recipientWallet, error: recipientWalletError } = await recipientWalletQuery.single()

    if (recipientWalletError || !recipientWallet) {
      throw new Error('Recipient wallet not found')
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
      .eq('id', senderWallet.id)

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
      .eq('id', recipientWallet.id)

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
        currency: 'usd',
        status: 'completed',
        description: description
      })
      .select()
      .single()

    if (transferError) {
      console.error('Failed to record transfer:', transferError)
    }

    // Record transactions for both users
    await Promise.all([
      // Sender transaction
      supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: `Money sent to ${recipient_phone || recipient_email}`,
          amount: amount,
          type: 'expense',
          category: 'Transfer',
          date: new Date().toISOString().split('T')[0],
          status: 'completed'
        }),
      
      // Recipient transaction
      supabase
        .from('transactions')
        .insert({
          user_id: recipientProfile.id,
          name: `Money received from ${senderPhone || user.email}`,
          amount: amount,
          type: 'income',
          category: 'Transfer',
          date: new Date().toISOString().split('T')[0],
          status: 'completed'
        })
    ])

    console.log('Money transfer completed successfully')

    return new Response(JSON.stringify({
      success: true,
      transfer_id: transfer?.id,
      sender_new_balance: newSenderBalance / 100,
      recipient_new_balance: newRecipientBalance / 100
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
