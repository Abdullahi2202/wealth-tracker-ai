import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const { action, transactionId, newStatus } = await req.json()

    if (action === 'fetchTransactions') {
      // Fetch all transactions with service role permissions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          amount,
          type,
          name,
          status,
          created_at,
          updated_at,
          category,
          note,
          sender_user_id,
          recipient_user_id
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching transactions:', error)
        throw error
      }

      return new Response(
        JSON.stringify({ transactions }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'updateStatus') {
      if (!transactionId || !newStatus) {
        throw new Error('Transaction ID and new status are required')
      }

      // Get transaction details first
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (fetchError) {
        console.error('Error fetching transaction:', fetchError)
        throw fetchError
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
        throw updateError
      }

      // Handle money transfer logic if applicable
      if (newStatus === 'completed') {
        await handleTransactionApproval(supabase, transactionData)
      } else if (newStatus === 'rejected') {
        await handleTransactionRejection(supabase, transactionData)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'deleteTransaction') {
      if (!transactionId) {
        throw new Error('Transaction ID is required')
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (error) {
        console.error('Error deleting transaction:', error)
        throw error
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error in admin-transaction-management:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function handleTransactionApproval(supabase: any, transactionData: any) {
  try {
    console.log('Handling transaction approval for:', transactionData.id)
    
    // Find the corresponding money transfer
    const { data: transferData, error: transferError } = await supabase
      .from('money_transfers')
      .select('*')
      .eq('amount', Math.round(transactionData.amount * 100))
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (transferError) {
      console.error('Error finding money transfer:', transferError)
      return
    }

    if (!transferData) {
      console.log('No money transfer found, transaction approved without transfer')
      return
    }

    console.log('Found money transfer:', transferData.id)

    // Update money transfer status
    const { error: transferUpdateError } = await supabase
      .from('money_transfers')
      .update({ status: 'completed' })
      .eq('id', transferData.id)

    if (transferUpdateError) {
      console.error('Error updating money transfer:', transferUpdateError)
      throw transferUpdateError
    }

    // Handle wallet balance updates
    const { data: recipientWallet, error: recipientError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', transferData.recipient_id)
      .single()

    if (recipientError) {
      console.error('Error finding recipient wallet:', recipientError)
      throw recipientError
    }

    // Add money to recipient
    const newRecipientBalance = Number(recipientWallet.balance) + Number(transactionData.amount)
    const { error: recipientUpdateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newRecipientBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', transferData.recipient_id)

    if (recipientUpdateError) {
      console.error('Error updating recipient wallet:', recipientUpdateError)
      throw recipientUpdateError
    }

    // Send notification to sender
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', transferData.sender_id)
      .maybeSingle()

    if (senderProfile?.email) {
      await supabase.functions.invoke('send-notification', {
        body: {
          email: senderProfile.email,
          type: 'transaction_approved',
          status: 'completed',
          message: `Your transaction of $${transactionData.amount} has been approved and completed successfully.`
        }
      })
    }

    console.log('Transaction approval completed successfully')
  } catch (error) {
    console.error('Error handling transaction approval:', error)
    throw error
  }
}

async function handleTransactionRejection(supabase: any, transactionData: any) {
  try {
    console.log('Handling transaction rejection for:', transactionData.id)
    
    // Find the corresponding money transfer
    const { data: transferData, error: transferError } = await supabase
      .from('money_transfers')
      .select('*')
      .eq('amount', Math.round(transactionData.amount * 100))
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (transferError) {
      console.error('Error finding money transfer:', transferError)
      return
    }

    if (!transferData) {
      console.log('No money transfer found, transaction rejected without refund')
      return
    }

    console.log('Found money transfer:', transferData.id)

    // Update money transfer status
    const { error: transferUpdateError } = await supabase
      .from('money_transfers')
      .update({ status: 'rejected' })
      .eq('id', transferData.id)

    if (transferUpdateError) {
      console.error('Error updating money transfer:', transferUpdateError)
      throw transferUpdateError
    }

    // Refund the sender
    const { data: senderWallet, error: senderError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', transferData.sender_id)
      .single()

    if (senderError) {
      console.error('Error finding sender wallet:', senderError)
      throw senderError
    }

    const refundedBalance = Number(senderWallet.balance) + Number(transactionData.amount)
    const { error: senderUpdateError } = await supabase
      .from('wallets')
      .update({ 
        balance: refundedBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', transferData.sender_id)

    if (senderUpdateError) {
      console.error('Error updating sender wallet:', senderUpdateError)
      throw senderUpdateError
    }

    // Send notification to sender
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', transferData.sender_id)
      .maybeSingle()

    if (senderProfile?.email) {
      await supabase.functions.invoke('send-notification', {
        body: {
          email: senderProfile.email,
          type: 'transaction_rejected',
          status: 'rejected',
          message: `Your transaction of $${transactionData.amount} has been rejected by admin. The money has been refunded to your wallet.`
        }
      })
    }

    console.log('Transaction rejection completed successfully')
  } catch (error) {
    console.error('Error handling transaction rejection:', error)
    throw error
  }
}