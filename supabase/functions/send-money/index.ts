
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

    // Parse request body
    let requestBody
    try {
      const bodyText = await req.text()
      console.log('Raw request body:', bodyText)
      
      if (!bodyText.trim()) {
        throw new Error('Empty request body')
      }
      
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Invalid JSON in request body')
    }

    const { 
      recipient_phone, 
      amount, 
      description, 
      transfer_type = 'user_to_user',
      bank_account,
      qr_code_data 
    } = requestBody

    console.log('Processing transfer:', { 
      from: user.email, 
      to: recipient_phone, 
      amount,
      transfer_type
    })

    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    // Get sender's profile and wallet
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()

    const senderPhone = senderProfile?.phone
    if (!senderPhone) {
      throw new Error('Sender phone number not found. Please update your profile.')
    }

    // Get sender's wallet
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_phone', senderPhone)
      .single()

    if (senderWalletError || !senderWallet) {
      console.error('Sender wallet not found:', senderWalletError)
      throw new Error('Sender wallet not found')
    }

    if (senderWallet.balance < amount) {
      throw new Error(`Insufficient balance: $${senderWallet.balance} available, $${amount} required`)
    }

    let transferResult
    
    switch (transfer_type) {
      case 'user_to_user':
        transferResult = await processUserToUserTransfer(
          supabase, user, senderWallet, recipient_phone, amount, description
        )
        break
        
      case 'bank_transfer':
        transferResult = await processBankTransfer(
          supabase, user, senderWallet, bank_account, amount, description
        )
        break
        
      case 'qr_payment':
        transferResult = await processQRPayment(
          supabase, user, senderWallet, qr_code_data, amount, description
        )
        break
        
      default:
        throw new Error('Invalid transfer type')
    }

    console.log('=== TRANSFER COMPLETED SUCCESSFULLY ===')
    return new Response(JSON.stringify(transferResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== SEND MONEY ERROR ===')
    console.error('Error details:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process transfer'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processUserToUserTransfer(
  supabase: any, 
  user: any, 
  senderWallet: any, 
  recipient_phone: string, 
  amount: number, 
  description?: string
) {
  if (!recipient_phone || recipient_phone.includes('@')) {
    throw new Error('Valid phone number required for user transfers')
  }

  // Find recipient
  const { data: recipientProfile } = await supabase
    .from('profiles')
    .select('id, email, phone')
    .eq('phone', recipient_phone)
    .single()

  if (!recipientProfile) {
    throw new Error('Recipient phone number not found in our system')
  }

  // Get recipient's wallet
  const { data: recipientWallet, error: recipientWalletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_phone', recipient_phone)
    .single()

  if (recipientWalletError || !recipientWallet) {
    throw new Error('Recipient wallet not found')
  }

  // Update balances
  const newSenderBalance = senderWallet.balance - amount
  const newRecipientBalance = recipientWallet.balance + amount

  // Update sender wallet
  await supabase
    .from('wallets')
    .update({ 
      balance: newSenderBalance, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', senderWallet.id)

  // Update recipient wallet
  await supabase
    .from('wallets')
    .update({ 
      balance: newRecipientBalance, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', recipientWallet.id)

  // Record transfer
  const { data: transfer } = await supabase
    .from('money_transfers')
    .insert({
      sender_id: user.id,
      recipient_id: recipientProfile.id,
      amount: Math.round(amount * 100),
      currency: 'usd',
      status: 'completed',
      description: description || 'User to user transfer'
    })
    .select()
    .single()

  // Create transaction records
  await Promise.all([
    supabase.from('transactions').insert({
      user_id: user.id,
      name: `Sent to ${recipient_phone}`,
      amount: amount,
      type: 'expense',
      category: 'Transfer',
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      note: description
    }),
    supabase.from('transactions').insert({
      user_id: recipientProfile.id,
      name: `Received from ${senderWallet.user_phone}`,
      amount: amount,
      type: 'income',
      category: 'Transfer',
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      note: description
    })
  ])

  return {
    success: true,
    transfer_id: transfer?.id,
    transfer_type: 'user_to_user',
    sender_new_balance: newSenderBalance,
    recipient_new_balance: newRecipientBalance,
    amount_transferred: amount,
    message: 'Transfer completed successfully'
  }
}

async function processBankTransfer(
  supabase: any, 
  user: any, 
  senderWallet: any, 
  bank_account: any, 
  amount: number, 
  description?: string
) {
  if (!bank_account || !bank_account.account_number || !bank_account.routing_number) {
    throw new Error('Valid bank account details required')
  }

  // Update sender balance
  const newSenderBalance = senderWallet.balance - amount
  await supabase
    .from('wallets')
    .update({ 
      balance: newSenderBalance, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', senderWallet.id)

  // Record bank transfer
  const { data: transfer } = await supabase
    .from('money_transfers')
    .insert({
      sender_id: user.id,
      recipient_id: null,
      amount: Math.round(amount * 100),
      currency: 'usd',
      status: 'processing',
      description: `Bank transfer to ${bank_account.account_number.slice(-4)}`
    })
    .select()
    .single()

  // Create transaction record
  await supabase.from('transactions').insert({
    user_id: user.id,
    name: `Bank Transfer to ${bank_account.account_number.slice(-4)}`,
    amount: amount,
    type: 'expense',
    category: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    status: 'processing',
    note: description
  })

  return {
    success: true,
    transfer_id: transfer?.id,
    transfer_type: 'bank_transfer',
    sender_new_balance: newSenderBalance,
    amount_transferred: amount,
    message: 'Bank transfer initiated successfully',
    processing_time: '1-3 business days'
  }
}

async function processQRPayment(
  supabase: any, 
  user: any, 
  senderWallet: any, 
  qr_code_data: any, 
  amount: number, 
  description?: string
) {
  if (!qr_code_data || !qr_code_data.merchant_id) {
    throw new Error('Valid QR code data required')
  }

  // Update sender balance
  const newSenderBalance = senderWallet.balance - amount
  await supabase
    .from('wallets')
    .update({ 
      balance: newSenderBalance, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', senderWallet.id)

  // Record QR payment
  const { data: transfer } = await supabase
    .from('money_transfers')
    .insert({
      sender_id: user.id,
      recipient_id: null,
      amount: Math.round(amount * 100),
      currency: 'usd',
      status: 'completed',
      description: `QR Payment to ${qr_code_data.merchant_name || qr_code_data.merchant_id}`
    })
    .select()
    .single()

  // Create transaction record
  await supabase.from('transactions').insert({
    user_id: user.id,
    name: `QR Payment to ${qr_code_data.merchant_name || qr_code_data.merchant_id}`,
    amount: amount,
    type: 'expense',
    category: 'QR Payment',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    note: description
  })

  return {
    success: true,
    transfer_id: transfer?.id,
    transfer_type: 'qr_payment',
    sender_new_balance: newSenderBalance,
    amount_transferred: amount,
    message: 'QR payment completed successfully'
  }
}
