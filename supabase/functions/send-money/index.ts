
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  console.log('=== SEND MONEY FUNCTION STARTED ===')
  
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

    const { recipient_phone, amount, description } = await req.json()

    // Only allow phone numbers - no email support
    if (!recipient_phone || amount <= 0) {
      throw new Error('Invalid recipient phone number or amount')
    }

    // Reject if email is provided instead of phone
    if (recipient_phone.includes('@')) {
      throw new Error('Only phone number transfers are supported. Email transfers are not allowed.')
    }

    console.log('Processing payment:', { 
      from: user.email, 
      to: recipient_phone, 
      amount 
    })

    // Get sender's profile and wallet
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()

    const senderPhone = senderProfile?.phone
    console.log('Sender profile:', { email: user.email, phone: senderPhone })

    if (!senderPhone) {
      throw new Error('Sender phone number not found. Please update your profile.')
    }

    // Get sender's wallet by phone number
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_phone', senderPhone)
      .single()

    if (senderWalletError || !senderWallet) {
      console.error('Sender wallet not found:', senderWalletError)
      throw new Error('Sender wallet not found')
    }

    console.log('Sender wallet found:', { balance: senderWallet.balance, phone: senderWallet.user_phone })

    if (senderWallet.balance < amount) {
      throw new Error(`Insufficient balance: $${senderWallet.balance} available, $${amount} required`)
    }

    // Find recipient profile by phone number only
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('id, email, phone')
      .eq('phone', recipient_phone)
      .single()

    if (!recipientProfile) {
      throw new Error('Recipient phone number not found in our system')
    }

    console.log('Recipient found:', { email: recipientProfile.email, phone: recipientProfile.phone })

    // Get recipient's wallet by phone number
    const { data: recipientWallet, error: recipientWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_phone', recipient_phone)
      .single()

    if (recipientWalletError || !recipientWallet) {
      console.error('Recipient wallet not found:', recipientWalletError)
      throw new Error('Recipient wallet not found')
    }

    console.log('Recipient wallet found:', { balance: recipientWallet.balance, phone: recipientWallet.user_phone })

    // Calculate new balances
    const newSenderBalance = senderWallet.balance - amount
    const newRecipientBalance = recipientWallet.balance + amount

    console.log('Updating balances:', {
      sender: { from: senderWallet.balance, to: newSenderBalance },
      recipient: { from: recipientWallet.balance, to: newRecipientBalance }
    })

    // Update sender wallet
    const { error: senderUpdateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newSenderBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', senderWallet.id)

    if (senderUpdateError) {
      console.error('Failed to update sender balance:', senderUpdateError)
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
      console.error('Failed to update recipient balance:', recipientUpdateError)
      throw new Error('Failed to update recipient balance')
    }

    // Record money transfer
    const { data: transfer, error: transferError } = await supabase
      .from('money_transfers')
      .insert({
        sender_id: user.id,
        recipient_id: recipientProfile.id,
        amount: Math.round(amount * 100), // Convert to cents for storage
        currency: 'usd',
        status: 'completed',
        description: description || 'Money transfer'
      })
      .select()
      .single()

    if (transferError) {
      console.error('Failed to record transfer:', transferError)
    } else {
      console.log('Transfer recorded:', transfer.id)
    }

    // Record transactions for both users
    const transactionPromises = [
      // Sender transaction (expense)
      supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: `Sent to ${recipient_phone}`,
          amount: amount,
          type: 'expense',
          category: 'Transfer',
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          note: description
        }),
      
      // Recipient transaction (income)
      supabase
        .from('transactions')
        .insert({
          user_id: recipientProfile.id,
          name: `Received from ${senderPhone}`,
          amount: amount,
          type: 'income',
          category: 'Transfer',
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          note: description
        })
    ]

    await Promise.all(transactionPromises)
    console.log('Transaction records created')

    console.log('=== MONEY TRANSFER COMPLETED SUCCESSFULLY ===')

    return new Response(JSON.stringify({
      success: true,
      transfer_id: transfer?.id,
      sender_new_balance: newSenderBalance,
      recipient_new_balance: newRecipientBalance,
      amount_transferred: amount,
      message: 'Payment sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== SEND MONEY ERROR ===')
    console.error('Error details:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process payment'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
