
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

    // Parse request body with better error handling
    let requestBody
    try {
      const bodyText = await req.text()
      console.log('Raw request body:', bodyText)
      
      if (!bodyText.trim()) {
        throw new Error('Request body is empty')
      }
      
      requestBody = JSON.parse(bodyText)
      console.log('Parsed request body:', requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Invalid JSON format in request body')
    }

    const { 
      recipient_phone, 
      amount, 
      description = '', 
      transfer_type = 'user_to_user'
    } = requestBody

    console.log('Processing user-to-user transfer:', { 
      from: user.email, 
      to: recipient_phone, 
      amount
    })

    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    if (!recipient_phone || recipient_phone.includes('@')) {
      throw new Error('Valid phone number required for user transfers')
    }

    // Check if amount is above $100 - if so, make it pending
    const requiresApproval = Number(amount) > 100
    const transferStatus = requiresApproval ? 'pending' : 'completed'

    console.log('Transfer requires approval:', requiresApproval, 'Status:', transferStatus)

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

    // Get sender's wallet by user_id first, then fallback to phone
    let { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (senderWalletError || !senderWallet) {
      console.log('Trying to find wallet by phone:', senderPhone)
      const { data: phoneWallet, error: phoneError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_phone', senderPhone.trim())
        .single()
      
      if (phoneError || !phoneWallet) {
        console.error('Sender wallet not found:', { senderWalletError, phoneError })
        throw new Error('Sender wallet not found')
      }
      senderWallet = phoneWallet
    }

    console.log('Sender wallet found:', { balance: senderWallet.balance, phone: senderWallet.user_phone })

    if (Number(senderWallet.balance) < Number(amount)) {
      throw new Error(`Insufficient balance: $${senderWallet.balance} available, $${amount} required`)
    }

    const cleanRecipientPhone = recipient_phone.trim()
    console.log('Looking for recipient with phone:', cleanRecipientPhone)

    // Find recipient by phone number in profiles
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('id, email, phone')
      .eq('phone', cleanRecipientPhone)
      .single()

    if (!recipientProfile) {
      throw new Error(`No user found with phone number: ${cleanRecipientPhone}. Please ensure the recipient is registered.`)
    }

    console.log('Recipient found:', recipientProfile)

    // Get recipient's wallet - try by user_id first, then by phone, create if not found
    let { data: recipientWallet, error: recipientWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', recipientProfile.id)
      .single()

    if (recipientWalletError || !recipientWallet) {
      console.log('Trying to find recipient wallet by phone')
      const { data: phoneWallet, error: phoneError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_phone', cleanRecipientPhone)
        .single()
      
      if (phoneError || !phoneWallet) {
        console.log('Creating new wallet for recipient')
        // Create wallet for recipient
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: recipientProfile.id,
            user_email: recipientProfile.email,
            user_phone: cleanRecipientPhone,
            balance: 0
          })
          .select()
          .single()

        if (createError) {
          console.error('Failed to create recipient wallet:', createError)
          throw new Error('Failed to create recipient wallet')
        }
        recipientWallet = newWallet
      } else {
        recipientWallet = phoneWallet
      }
    }

    console.log('Recipient wallet found/created:', { balance: recipientWallet.balance })

    // Balance updates - ONLY for completed transfers (under $100)
    let newSenderBalance = Number(senderWallet.balance)
    let newRecipientBalance = Number(recipientWallet.balance)

    if (!requiresApproval) {
      // Only update balances if transfer doesn't require approval (under $100)
      newSenderBalance = Number(senderWallet.balance) - Number(amount)
      newRecipientBalance = Number(recipientWallet.balance) + Number(amount)

      console.log('Balance calculations (immediate transfer):', {
        senderOld: senderWallet.balance,
        senderNew: newSenderBalance,
        recipientOld: recipientWallet.balance,
        recipientNew: newRecipientBalance
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
        console.error('Failed to update sender wallet:', senderUpdateError)
        throw new Error('Failed to update sender wallet')
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
        console.error('Failed to update recipient wallet:', recipientUpdateError)
        // Rollback sender wallet
        await supabase
          .from('wallets')
          .update({ balance: senderWallet.balance })
          .eq('id', senderWallet.id)
        throw new Error('Failed to update recipient wallet')
      }
    } else {
      console.log('Transfer requires approval - balances not updated yet')
      // For pending transfers, temporarily deduct from sender to prevent double spending
      const tempBalance = Number(senderWallet.balance) - Number(amount)
      await supabase
        .from('wallets')
        .update({ 
          balance: tempBalance, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', senderWallet.id)
      
      newSenderBalance = tempBalance
    }

    // Record transfer in money_transfers table
    const { data: transfer, error: transferError } = await supabase
      .from('money_transfers')
      .insert({
        sender_id: user.id,
        recipient_id: recipientProfile.id,
        amount: Math.round(Number(amount) * 100), // Store in cents
        currency: 'usd',
        status: transferStatus,
        description: description || `Transfer to ${cleanRecipientPhone}`
      })
      .select()
      .single()

    if (transferError) {
      console.error('Failed to record transfer:', transferError)
    }

    // Create transaction records with appropriate status
    const senderNote = requiresApproval 
      ? `${description} - Pending admin approval (amount > $100)` 
      : description

    const recipientNote = requiresApproval 
      ? `${description} - Pending admin approval (amount > $100)` 
      : description

    await Promise.all([
      supabase.from('transactions').insert({
        user_id: user.id,
        name: `Sent to ${cleanRecipientPhone}`,
        amount: Number(amount),
        type: 'expense',
        category: 'Transfer',
        date: new Date().toISOString().split('T')[0],
        status: transferStatus,
        note: senderNote
      }),
      supabase.from('transactions').insert({
        user_id: recipientProfile.id,
        name: `Received from ${senderWallet.user_phone || user.email}`,
        amount: Number(amount),
        type: 'income',
        category: 'Transfer',
        date: new Date().toISOString().split('T')[0],
        status: transferStatus,
        note: recipientNote
      })
    ])

    // Send notification if pending
    if (requiresApproval) {
      await supabase.functions.invoke('send-notification', {
        body: {
          email: user.email,
          type: 'transaction_pending',
          status: 'pending',
          message: `Your transfer of $${amount} to ${cleanRecipientPhone} is pending admin approval and will be processed within 24 hours.`
        }
      })
    }

    const responseMessage = requiresApproval 
      ? `Transfer of $${amount} is pending admin approval. You will be notified once reviewed.`
      : `Transfer of $${amount} completed successfully to ${cleanRecipientPhone}`

    console.log('=== TRANSFER PROCESSED ===', { requiresApproval, status: transferStatus })
    return new Response(JSON.stringify({
      success: true,
      transfer_id: transfer?.id,
      transfer_type: 'user_to_user',
      sender_new_balance: newSenderBalance,
      recipient_new_balance: newRecipientBalance,
      amount_transferred: Number(amount),
      status: transferStatus,
      requires_approval: requiresApproval,
      message: responseMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== SEND MONEY ERROR ===')
    console.error('Error details:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process transfer',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
