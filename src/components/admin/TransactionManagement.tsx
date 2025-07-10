
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TransactionStatsCards from "./transactions/TransactionStatsCards";
import TransactionFilters from "./transactions/TransactionFilters";
import TransactionTable from "./transactions/TransactionTable";
import { toast } from "@/hooks/use-toast";

type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  category: string;
  note: string;
  user_email?: string;
  user_name?: string;
  user_phone?: string;
};

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      console.log('Fetching transactions for admin...');
      
      const { data, error } = await supabase.functions.invoke('admin-transaction-management', {
        body: { action: 'fetchTransactions' }
      });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
        return;
      }

      console.log('Transactions fetched successfully:', data?.transactions?.length || 0);
      setTransactions(data?.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId: string, newStatus: string) => {
    setActionLoading(`status-${transactionId}`);
    console.log(`Updating transaction ${transactionId} to ${newStatus}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-transaction-management', {
        body: { 
          action: 'updateStatus',
          transactionId,
          newStatus
        }
      });

      if (error) {
        throw error;
      }

      await fetchTransactions(); // Refresh the data
      toast({
        title: "Success",
        description: data?.message || `Transaction ${newStatus} successfully`,
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction status",
        variant: "destructive",
      });
    }
    setActionLoading(null);
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return;

    setActionLoading(`delete-${transactionId}`);
    console.log(`Deleting transaction ${transactionId}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-transaction-management', {
        body: { 
          action: 'deleteTransaction',
          transactionId
        }
      });

      if (error) {
        throw error;
      }

      await fetchTransactions(); // Refresh the data
      toast({
        title: "Success",
        description: data?.message || "Transaction deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
    setActionLoading(null);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.user_email && transaction.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.user_name && transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.note && transaction.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const calculateStats = () => {
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const incomeAmount = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expenseAmount = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    const pendingCount = filteredTransactions.filter(t => t.status === "pending").length;
    
    return { totalAmount, incomeAmount, expenseAmount, pendingCount };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transaction Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage user transactions, approve/reject pending transactions, and monitor financial activity
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <TransactionStatsCards stats={stats} />
      
      <TransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />

      <TransactionTable
        transactions={filteredTransactions}
        actionLoading={actionLoading}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
      />

      {filteredTransactions.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="bg-gray-50 rounded-lg p-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {transactions.length === 0 ? "No transactions found" : "No matching transactions"}
            </h3>
            <p className="text-gray-500">
              {transactions.length === 0 
                ? "There are no transactions in the system yet."
                : "Try adjusting your search criteria or filters."
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
