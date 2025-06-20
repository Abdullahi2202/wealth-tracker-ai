
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
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Parse request body to get action
    const body = await req.json()
    const { action } = body

    console.log('Processing action:', action, 'for user:', user.email)

    switch (action) {
      case 'get-balance':
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_email', user.email)
          .maybeSingle()

        if (walletError) throw walletError

        if (!wallet) {
          // Create wallet if doesn't exist
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({
              user_id: user.id,
              user_email: user.email,
              balance: 0
            })
            .select()
            .single()

          if (createError) throw createError
          
          return new Response(JSON.stringify(newWallet), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(wallet), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'add-funds':
        const { amount, source, description } = body
        
        if (!amount || amount <= 0) {
          throw new Error('Invalid amount')
        }

        console.log('Adding funds:', { amount, source, description, user_email: user.email })

        // Get current wallet
        const { data: currentWallet, error: getCurrentError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_email', user.email)
          .maybeSingle()

        if (getCurrentError) throw getCurrentError

        let walletToUpdate = currentWallet
        if (!walletToUpdate) {
          // Create wallet if it doesn't exist
          const { data: newWallet, error: createWalletError } = await supabase
            .from('wallets')
            .insert({
              user_id: user.id,
              user_email: user.email,
              balance: 0
            })
            .select()
            .single()

          if (createWalletError) throw createWalletError
          walletToUpdate = newWallet
        }

        const newBalance = Number(walletToUpdate.balance) + Number(amount)

        // Update wallet balance
        const { data: updatedWallet, error: updateError } = await supabase
          .from('wallets')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_email', user.email)
          .select()
          .single()

        if (updateError) throw updateError

        // Record transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.email,
            name: description || 'Wallet Top-Up',
            amount: Number(amount),
            type: 'income',
            category: 'Top-Up',
            date: new Date().toISOString().split('T')[0]
          })

        if (transactionError) {
          console.error('Transaction recording error:', transactionError)
          // Don't throw here, the wallet update succeeded
        }

        console.log('Funds added successfully:', updatedWallet)

        return new Response(JSON.stringify(updatedWallet), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'send-payment':
        const { recipient, sendAmount, note } = body
        
        if (!sendAmount || sendAmount <= 0) {
          throw new Error('Invalid amount')
        }

        if (!recipient) {
          throw new Error('Recipient required')
        }

        // Get current wallet
        const { data: senderWallet, error: getSenderError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_email', user.email)
          .single()

        if (getSenderError) throw getSenderError

        if (Number(senderWallet.balance) < Number(sendAmount)) {
          throw new Error('Insufficient funds')
        }

        const newSenderBalance = Number(senderWallet.balance) - Number(sendAmount)

        // Update sender wallet
        const { error: updateSenderError } = await supabase
          .from('wallets')
          .update({ 
            balance: newSenderBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_email', user.email)

        if (updateSenderError) throw updateSenderError

        // Record sender transaction
        const { error: senderTransactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.email,
            name: 'Payment Sent',
            amount: Number(sendAmount),
            type: 'expense',
            category: 'Transfer',
            recipient_user_id: recipient,
            note: note || null,
            date: new Date().toISOString().split('T')[0]
          })

        if (senderTransactionError) throw senderTransactionError

        // Try to credit recipient if they have a wallet
        const { data: recipientWallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_email', recipient)
          .maybeSingle()

        if (recipientWallet) {
          const newRecipientBalance = Number(recipientWallet.balance) + Number(sendAmount)
          
          await supabase
            .from('wallets')
            .update({ 
              balance: newRecipientBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_email', recipient)

          // Record recipient transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: recipient,
              name: 'Payment Received',
              amount: Number(sendAmount),
              type: 'income',
              category: 'Transfer',
              sender_user_id: user.email,
              note: note || null,
              date: new Date().toISOString().split('T')[0]
            })
        }

        return new Response(JSON.stringify({ success: true, newBalance: newSenderBalance }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        throw new Error(`Invalid action: ${action}`)
    }

  } catch (error) {
    console.error('Wallet operations error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
