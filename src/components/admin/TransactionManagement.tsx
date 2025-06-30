import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Download, Search, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  name: string;
  category: string | null;
  note: string | null;
  created_at: string;
};

type TransactionWithDetails = Transaction & {
  user_email?: string;
  user_name?: string;
  user_phone?: string;
};

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
  const [statusUpdateReason, setStatusUpdateReason] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      console.log('Fetching transactions as admin...');
      
      // Use the admin-operations edge function to fetch all transactions
      const { data: response, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'get_all_transactions'
        }
      });

      if (error) {
        console.error('Error fetching transactions via edge function:', error);
        
        // Fallback: Try direct database query
        console.log('Trying direct database query...');
        const { data: transactionsData, error: directError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (directError) {
          console.error('Direct query also failed:', directError);
          toast({
            title: "Error",
            description: "Failed to fetch transactions",
            variant: "destructive",
          });
          return;
        }

        console.log('Direct query successful, transactions found:', transactionsData?.length || 0);
        
        // Fetch user details for each transaction
        const transactionsWithDetails: TransactionWithDetails[] = [];
        
        if (transactionsData) {
          for (const transaction of transactionsData) {
            let userDetails = null;
            
            if (transaction.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('email, full_name, phone')
                .eq('id', transaction.user_id)
                .maybeSingle();
              
              userDetails = profileData;
            }

            transactionsWithDetails.push({
              ...transaction,
              user_email: userDetails?.email,
              user_name: userDetails?.full_name,
              user_phone: userDetails?.phone
            });
          }
        }

        setTransactions(transactionsWithDetails);
      } else {
        console.log('Edge function successful, transactions found:', response?.transactions?.length || 0);
        setTransactions(response?.transactions || []);
      }
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

  const updateTransactionStatus = async (transactionId: string, newStatus: string, reason?: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        // Get the current transaction to append to existing notes
        const currentTransaction = transactions.find(t => t.id === transactionId);
        const existingNote = currentTransaction?.note || '';
        updateData.note = `${existingNote}\n[Admin Update: ${reason}]`.trim();
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId);

      if (error) {
        console.error('Error updating transaction:', error);
        toast({
          title: "Error",
          description: "Failed to update transaction",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Transaction marked as ${newStatus}`,
        });
        fetchTransactions(); // Refresh the list
        setShowStatusModal(false);
        setStatusUpdateReason("");
        setNewStatus("");
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const exportTransactions = async () => {
    try {
      const csvContent = [
        ['Date', 'Transaction ID', 'User', 'Type', 'Amount', 'Status', 'Category', 'Note'].join(','),
        ...filteredTransactions.map(t => [
          new Date(t.created_at).toLocaleDateString(),
          t.id,
          t.user_name || t.user_email || 'Unknown',
          t.type,
          t.amount,
          t.status,
          t.category || '',
          t.note || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success", 
        description: "Transactions exported successfully",
      });
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: "Error",
        description: "Failed to export transactions",
        variant: "destructive",
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    const matchesDateRange = (!dateRange.from || new Date(transaction.created_at) >= new Date(dateRange.from)) &&
                           (!dateRange.to || new Date(transaction.created_at) <= new Date(dateRange.to));
    
    return matchesSearch && matchesStatus && matchesType && matchesDateRange;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income": return "bg-green-100 text-green-800";
      case "expense": return "bg-red-100 text-red-800";
      case "transfer": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateStats = () => {
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const completedTransactions = filteredTransactions.filter(t => t.status === "completed").length;
    const pendingTransactions = filteredTransactions.filter(t => t.status === "pending").length;
    const failedTransactions = filteredTransactions.filter(t => t.status === "failed").length;
    
    return { totalAmount, completedTransactions, pendingTransactions, failedTransactions };
  };

  const stats = calculateStats();

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTransactions}</div>
            <p className="text-xs text-muted-foreground">Successful transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedTransactions}</div>
            <p className="text-xs text-muted-foreground">Failed transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            placeholder="From date"
          />
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            placeholder="To date"
          />
        </div>

        <Button onClick={exportTransactions} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>User Details</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{transaction.id.substring(0, 8)}...</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.user_name || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">{transaction.user_email}</div>
                    {transaction.user_phone && (
                      <div className="text-sm text-muted-foreground">{transaction.user_phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.name}</div>
                    {transaction.category && (
                      <div className="text-sm text-muted-foreground">{transaction.category}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(transaction.type)}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  ${transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowStatusModal(true);
                      }}
                    >
                      Update Status
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No transactions found matching your criteria.
        </div>
      )}

      {/* Transaction Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Transaction ID</label>
                  <p className="font-mono text-sm">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p>{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p>{selectedTransaction.user_name || selectedTransaction.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="font-mono">${selectedTransaction.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Badge className={getTypeColor(selectedTransaction.type)}>
                    {selectedTransaction.type}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>
              {selectedTransaction.note && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {selectedTransaction.note}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Transaction Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                value={statusUpdateReason}
                onChange={(e) => setStatusUpdateReason(e.target.value)}
                placeholder="Enter reason for status change..."
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => selectedTransaction && updateTransactionStatus(
                  selectedTransaction.id, 
                  newStatus, 
                  statusUpdateReason
                )}
                disabled={!newStatus}
              >
                Update Status
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatus("");
                  setStatusUpdateReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionManagement;
