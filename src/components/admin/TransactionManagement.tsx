
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TransactionStatsCards from "./transactions/TransactionStatsCards";
import TransactionFilters from "./transactions/TransactionFilters";
import TransactionTable from "./transactions/TransactionTable";
import { useTransactionActions } from "./transactions/useTransactionActions";
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
};

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { updateTransactionStatus, deleteTransaction } = useTransactionActions();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      console.log('Fetching transactions for admin...');
      
      // Use service role permissions to fetch all transactions
      const { data, error } = await supabase
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
          note
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
        return;
      }

      console.log('Transactions fetched successfully:', data?.length || 0);
      setTransactions(data || []);
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
    
    const success = await updateTransactionStatus(transactionId, newStatus);
    if (success) {
      await fetchTransactions(); // Refresh the data
      toast({
        title: "Success",
        description: `Transaction ${newStatus} successfully`,
      });
    }
    setActionLoading(null);
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    setActionLoading(`delete-${transactionId}`);
    console.log(`Deleting transaction ${transactionId}`);
    
    const success = await deleteTransaction(transactionId);
    if (success) {
      await fetchTransactions(); // Refresh the data
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    }
    setActionLoading(null);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <h2 className="text-2xl font-bold text-gray-800">Transaction Management</h2>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="text-center py-8 text-gray-500">
          {transactions.length === 0 
            ? "No transactions found in the system."
            : "No transactions found matching your criteria."
          }
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
