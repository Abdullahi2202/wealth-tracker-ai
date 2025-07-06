
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useTransactionActions = () => {
  const updateTransactionStatus = async (transactionId: string, newStatus: string) => {
    try {
      // Get transaction details first
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Update transaction status
      const { error: transactionUpdateError } = await supabase
        .from('transactions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (transactionUpdateError) throw transactionUpdateError;

      // Handle money transfer logic based on status
      if (newStatus === 'completed') {
        await handleTransactionApproval(transactionData);
      } else if (newStatus === 'rejected') {
        await handleTransactionRejection(transactionData);
      }

      toast({
        title: "Success",
        description: `Transaction ${newStatus} successfully`,
      });

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
      // Find the corresponding money transfer
      const { data: transferData, error: transferError } = await supabase
        .from('money_transfers')
        .select('*')
        .eq('amount', Math.round(transactionData.amount * 100))
        .eq('status', 'pending')
        .single();

      if (transferError) throw transferError;

      // Update money transfer status
      const { error: transferUpdateError } = await supabase
        .from('money_transfers')
        .update({ status: 'completed' })
        .eq('id', transferData.id);

      if (transferUpdateError) throw transferUpdateError;

      // Update related transactions
      const { error: relatedTransactionsError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('amount', transactionData.amount)
        .eq('status', 'pending');

      if (relatedTransactionsError) throw relatedTransactionsError;

      // Handle wallet balance updates
      const { data: recipientWallet, error: recipientError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transferData.recipient_id)
        .single();

      if (recipientError) throw recipientError;

      // Add money to recipient
      const newRecipientBalance = Number(recipientWallet.balance) + Number(transactionData.amount);
      const { error: recipientUpdateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newRecipientBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transferData.recipient_id);

      if (recipientUpdateError) throw recipientUpdateError;

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
    } catch (error) {
      console.error('Error handling transaction approval:', error);
      throw error;
    }
  };

  const handleTransactionRejection = async (transactionData: any) => {
    try {
      // Find the corresponding money transfer
      const { data: transferData, error: transferError } = await supabase
        .from('money_transfers')
        .select('*')
        .eq('amount', Math.round(transactionData.amount * 100))
        .eq('status', 'pending')
        .single();

      if (transferError) throw transferError;

      // Update money transfer status
      const { error: transferUpdateError } = await supabase
        .from('money_transfers')
        .update({ status: 'rejected' })
        .eq('id', transferData.id);

      if (transferUpdateError) throw transferUpdateError;

      // Update related transactions
      const { error: relatedTransactionsError } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('amount', transactionData.amount)
        .eq('status', 'pending');

      if (relatedTransactionsError) throw relatedTransactionsError;

      // Refund the sender
      const { data: senderWallet, error: senderError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transferData.sender_id)
        .single();

      if (senderError) throw senderError;

      const refundedBalance = Number(senderWallet.balance) + Number(transactionData.amount);
      const { error: senderUpdateError } = await supabase
        .from('wallets')
        .update({ 
          balance: refundedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transferData.sender_id);

      if (senderUpdateError) throw senderUpdateError;

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
    } catch (error) {
      console.error('Error handling transaction rejection:', error);
      throw error;
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });

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
