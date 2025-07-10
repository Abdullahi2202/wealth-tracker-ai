
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
    console.log('Processing action:', action, 'for transaction:', transactionId)

    if (action === 'fetchTransactions') {
      // Fetch all transactions with user profile information
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

      console.log('Fetched transactions:', transactions?.length || 0)

      // Get user profile information for each transaction
      const formattedTransactions = []
      
      for (const transaction of transactions || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name, phone')
          .eq('id', transaction.user_id)
          .single()
        
        formattedTransactions.push({
          ...transaction,
          user_email: profile?.email || 'Unknown',
          user_name: profile?.full_name || 'Unknown User',
          user_phone: profile?.phone || 'N/A'
        })
      }

      return new Response(
        JSON.stringify({ transactions: formattedTransactions }),
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

      console.log(`Updating transaction ${transactionId} to status: ${newStatus}`)

      // Get transaction details first
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()
      
      let userProfile = null
      if (transactionData && !fetchError) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', transactionData.user_id)
          .single()
        userProfile = profile
      }

      if (fetchError) {
        console.error('Error fetching transaction:', fetchError)
        throw fetchError
      }

      console.log('Transaction data:', transactionData)

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

      // Handle money transfer logic based on status
      if (newStatus === 'completed') {
        await handleTransactionApproval(supabase, transactionData)
      } else if (newStatus === 'rejected') {
        await handleTransactionRejection(supabase, transactionData)
      }

      // Send notification to user
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            email: userProfile?.email || transactionData.user_id,
            type: newStatus === 'completed' ? 'transaction_approved' : 'transaction_rejected',
            status: newStatus,
            message: `Your transaction "${transactionData.name}" of $${transactionData.amount} has been ${newStatus} by admin.`
          }
        })
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
        // Don't fail the whole operation if notification fails
      }

      return new Response(
        JSON.stringify({ success: true, message: `Transaction ${newStatus} successfully` }),
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

      console.log(`Deleting transaction: ${transactionId}`)

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (error) {
        console.error('Error deleting transaction:', error)
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Transaction deleted successfully' }),
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
    
    // For money transfers, update recipient wallet
    if (transactionData.type === 'transfer' && transactionData.recipient_user_id) {
      // Add money to recipient wallet
      const { data: recipientWallet, error: recipientError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transactionData.recipient_user_id)
        .single()

      if (!recipientError && recipientWallet) {
        const newBalance = Number(recipientWallet.balance) + Number(transactionData.amount)
        
        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transactionData.recipient_user_id)

        if (updateWalletError) {
          console.error('Error updating recipient wallet:', updateWalletError)
          throw updateWalletError
        }

        console.log(`Updated recipient wallet balance to: ${newBalance}`)
      }
    }

    // For income transactions, add to user wallet
    if (transactionData.type === 'income') {
      const { data: userWallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transactionData.user_id)
        .single()

      if (!walletError && userWallet) {
        const newBalance = Number(userWallet.balance) + Number(transactionData.amount)
        
        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transactionData.user_id)

        if (updateWalletError) {
          console.error('Error updating user wallet:', updateWalletError)
          throw updateWalletError
        }

        console.log(`Updated user wallet balance to: ${newBalance}`)
      }
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
    
    // For expense transactions, refund the user
    if (transactionData.type === 'expense') {
      const { data: userWallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transactionData.user_id)
        .single()

      if (!walletError && userWallet) {
        const refundedBalance = Number(userWallet.balance) + Number(transactionData.amount)
        
        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({ 
            balance: refundedBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', transactionData.user_id)

        if (updateWalletError) {
          console.error('Error refunding user wallet:', updateWalletError)
          throw updateWalletError
        }

        console.log(`Refunded user wallet balance to: ${refundedBalance}`)
      }
    }

    console.log('Transaction rejection completed successfully')
  } catch (error) {
    console.error('Error handling transaction rejection:', error)
    throw error
  }
}
