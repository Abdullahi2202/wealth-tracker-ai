
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useTransactionActions = () => {
  const updateTransactionStatus = async (transactionId: string, newStatus: string) => {
    try {
      console.log(`Updating transaction ${transactionId} to status: ${newStatus}`);
      
      // Get transaction details first
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) {
        console.error('Error fetching transaction:', fetchError);
        throw fetchError;
      }

      console.log('Transaction data:', transactionData);

      // Update transaction status
      const { error: transactionUpdateError } = await supabase
        .from('transactions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (transactionUpdateError) {
        console.error('Error updating transaction:', transactionUpdateError);
        throw transactionUpdateError;
      }

      // Handle money transfer logic based on status
      if (newStatus === 'completed') {
        await handleTransactionApproval(transactionData);
      } else if (newStatus === 'rejected') {
        await handleTransactionRejection(transactionData);
      }

      console.log(`Transaction ${transactionId} successfully updated to ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction status",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleTransactionApproval = async (transactionData: any) => {
    try {
      console.log('Handling transaction approval for:', transactionData.id);
      
      // Find the corresponding money transfer
      const { data: transferData, error: transferError } = await supabase
        .from('money_transfers')
        .select('*')
        .eq('amount', Math.round(transactionData.amount * 100))
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transferError) {
        console.error('Error finding money transfer:', transferError);
        // If no money transfer found, just approve the transaction
        console.log('No money transfer found, transaction approved without transfer');
        return;
      }

      console.log('Found money transfer:', transferData.id);

      // Update money transfer status
      const { error: transferUpdateError } = await supabase
        .from('money_transfers')
        .update({ status: 'completed' })
        .eq('id', transferData.id);

      if (transferUpdateError) {
        console.error('Error updating money transfer:', transferUpdateError);
        throw transferUpdateError;
      }

      // Update related transactions
      const { error: relatedTransactionsError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('amount', transactionData.amount)
        .eq('status', 'pending');

      if (relatedTransactionsError) {
        console.error('Error updating related transactions:', relatedTransactionsError);
      }

      // Handle wallet balance updates
      const { data: recipientWallet, error: recipientError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transferData.recipient_id)
        .single();

      if (recipientError) {
        console.error('Error finding recipient wallet:', recipientError);
        throw recipientError;
      }

      // Add money to recipient
      const newRecipientBalance = Number(recipientWallet.balance) + Number(transactionData.amount);
      const { error: recipientUpdateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newRecipientBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transferData.recipient_id);

      if (recipientUpdateError) {
        console.error('Error updating recipient wallet:', recipientUpdateError);
        throw recipientUpdateError;
      }

      // Send notification to sender
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', transferData.sender_id)
        .single();

      await supabase.functions.invoke('send-notification', {
        body: {
          email: senderProfile?.email || transactionData.user_id,
          type: 'transaction_approved',
          status: 'completed',
          message: `Your transaction of $${transactionData.amount} has been approved and completed successfully.`
        }
      });

      console.log('Transaction approval completed successfully');
    } catch (error) {
      console.error('Error handling transaction approval:', error);
      throw error;
    }
  };

  const handleTransactionRejection = async (transactionData: any) => {
    try {
      console.log('Handling transaction rejection for:', transactionData.id);
      
      // Find the corresponding money transfer
      const { data: transferData, error: transferError } = await supabase
        .from('money_transfers')
        .select('*')
        .eq('amount', Math.round(transactionData.amount * 100))
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transferError) {
        console.error('Error finding money transfer:', transferError);
        // If no money transfer found, just reject the transaction
        console.log('No money transfer found, transaction rejected without refund');
        return;
      }

      console.log('Found money transfer:', transferData.id);

      // Update money transfer status
      const { error: transferUpdateError } = await supabase
        .from('money_transfers')
        .update({ status: 'rejected' })
        .eq('id', transferData.id);

      if (transferUpdateError) {
        console.error('Error updating money transfer:', transferUpdateError);
        throw transferUpdateError;
      }

      // Update related transactions
      const { error: relatedTransactionsError } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('amount', transactionData.amount)
        .eq('status', 'pending');

      if (relatedTransactionsError) {
        console.error('Error updating related transactions:', relatedTransactionsError);
      }

      // Refund the sender
      const { data: senderWallet, error: senderError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transferData.sender_id)
        .single();

      if (senderError) {
        console.error('Error finding sender wallet:', senderError);
        throw senderError;
      }

      const refundedBalance = Number(senderWallet.balance) + Number(transactionData.amount);
      const { error: senderUpdateError } = await supabase
        .from('wallets')
        .update({ 
          balance: refundedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transferData.sender_id);

      if (senderUpdateError) {
        console.error('Error updating sender wallet:', senderUpdateError);
        throw senderUpdateError;
      }

      // Send notification to sender
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', transferData.sender_id)
        .single();

      await supabase.functions.invoke('send-notification', {
        body: {
          email: senderProfile?.email || transactionData.user_id,
          type: 'transaction_rejected',
          status: 'rejected',
          message: `Your transaction of $${transactionData.amount} has been rejected by admin. The money has been refunded to your wallet.`
        }
      });

      console.log('Transaction rejection completed successfully');
    } catch (error) {
      console.error('Error handling transaction rejection:', error);
      throw error;
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      console.log(`Deleting transaction: ${transactionId}`);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
      }

      console.log(`Transaction ${transactionId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    updateTransactionStatus,
    deleteTransaction
  };
};
