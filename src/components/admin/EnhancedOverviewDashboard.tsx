
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
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      if (error) throw error;

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
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction rejected",
      });

      await fetchPendingTransactions();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      });
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
