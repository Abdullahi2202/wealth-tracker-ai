
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserManagement } from "@/hooks/useUserManagement";
import { AdminQuickActions } from "./AdminQuickActions";
import { PendingActionsPanel } from "./PendingActionsPanel";
import { UserDetailsModal } from "./UserDetailsModal";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types/user";

const EnhancedOverviewDashboard = () => {
  const {
    users,
    loading,
    actionLoading,
    updateUserVerification
  } = useUserManagement();

  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    pendingUsers: users.filter(u => u.verification_status === 'pending').length,
    pendingTransactions: pendingTransactions.length,
    totalTransactionValue: pendingTransactions.reduce((sum, t) => sum + t.amount, 0)
  };

  const pendingUsers = users.filter(u => u.verification_status === 'pending');

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const fetchPendingTransactions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_all_transactions' }
      });

      if (error) throw error;

      const pending = (data?.transactions || []).filter((t: any) => t.status === 'pending');
      setPendingTransactions(pending);
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
    }
  };

  const handleApproveTransaction = async (transactionId: string) => {
    setTransactionLoading(true);
    try {
      // Get transaction details first
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Find the corresponding money transfer
      const { data: transferData, error: transferError } = await supabase
        .from('money_transfers')
        .select('*')
        .eq('amount', Math.round(transactionData.amount * 100))
        .eq('status', 'pending')
        .single();

      if (transferError) throw transferError;

      // Update transaction status to completed
      const { error: transactionUpdateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      if (transactionUpdateError) throw transactionUpdateError;

      // Update related transactions (both sender and recipient)
      const { error: relatedTransactionsError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('amount', transactionData.amount)
        .eq('status', 'pending');

      if (relatedTransactionsError) throw relatedTransactionsError;

      // Update money transfer status
      const { error: transferUpdateError } = await supabase
        .from('money_transfers')
        .update({ status: 'completed' })
        .eq('id', transferData.id);

      if (transferUpdateError) throw transferUpdateError;

      // Now handle the actual money transfer - add to recipient, sender was already deducted
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

      toast({
        title: "Success",
        description: "Transaction approved successfully",
      });

      await fetchPendingTransactions();
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({
        title: "Error",
        description: "Failed to approve transaction",
        variant: "destructive",
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    setTransactionLoading(true);
    try {
      // Get transaction details first
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Find the corresponding money transfer
      const { data: transferData, error: transferError } = await supabase
        .from('money_transfers')
        .select('*')
        .eq('amount', Math.round(transactionData.amount * 100))
        .eq('status', 'pending')
        .single();

      if (transferError) throw transferError;

      // Update transaction status to rejected
      const { error: transactionUpdateError } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', transactionId);

      if (transactionUpdateError) throw transactionUpdateError;

      // Update related transactions (both sender and recipient)
      const { error: relatedTransactionsError } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('amount', transactionData.amount)
        .eq('status', 'pending');

      if (relatedTransactionsError) throw relatedTransactionsError;

      // Update money transfer status
      const { error: transferUpdateError } = await supabase
        .from('money_transfers')
        .update({ status: 'rejected' })
        .eq('id', transferData.id);

      if (transferUpdateError) throw transferUpdateError;

      // Refund the sender - add money back to sender's wallet
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

      // Send notification to sender about rejection
      await supabase.functions.invoke('send-notification', {
        body: {
          email: transactionData.user_id, // This should be email, need to get it from profiles
          type: 'transaction_rejected',
          status: 'rejected',
          message: `Your transaction of $${transactionData.amount} has been rejected by admin. The money has been refunded to your wallet.`
        }
      });

      toast({
        title: "Success",
        description: "Transaction rejected and sender refunded",
      });

      await fetchPendingTransactions();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, email: string) => {
    await updateUserVerification(userId, 'verified', email);
  };

  const handleRejectUser = async (userId: string, email: string) => {
    await updateUserVerification(userId, 'rejected', email);
  };

  const viewDocument = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminQuickActions
        stats={stats}
        onViewPendingUsers={() => {}}
        onViewPendingTransactions={() => {}}
      />

      <PendingActionsPanel
        pendingUsers={pendingUsers}
        pendingTransactions={pendingTransactions}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
        onApproveTransaction={handleApproveTransaction}
        onRejectTransaction={handleRejectTransaction}
        onViewUser={(user) => {
          setSelectedUser(user);
          setShowUserModal(true);
        }}
        actionLoading={actionLoading}
      />

      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        actionLoading={actionLoading}
        onUpdateVerification={updateUserVerification}
        onViewDocument={viewDocument}
      />
    </div>
  );
};

export default EnhancedOverviewDashboard;
