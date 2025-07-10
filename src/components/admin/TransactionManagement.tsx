
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/60 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading transactions...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch the latest data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border border-border/50 p-8">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Transaction Management
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Monitor, approve, and manage all user transactions across the platform. 
              Keep track of financial activity and ensure secure payment processing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-primary">{transactions.length}</p>
            </div>
            <button
              onClick={fetchTransactions}
              className="group relative overflow-hidden rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <span className="relative z-10 flex items-center gap-2 font-medium">
                <svg className={`h-4 w-4 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2">
          <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-accent/10 to-primary/10 blur-lg"></div>
        </div>
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
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-6 max-w-md mx-auto">
            <div className="relative">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center">
                <svg className="h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-100 border-2 border-background flex items-center justify-center">
                <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">
                {transactions.length === 0 ? "No transactions found" : "No matching transactions"}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {transactions.length === 0 
                  ? "There are no transactions in the system yet. Transactions will appear here when users start making payments and transfers."
                  : "No transactions match your current search criteria or filters. Try adjusting your search terms or filter options to find what you're looking for."
                }
              </p>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
