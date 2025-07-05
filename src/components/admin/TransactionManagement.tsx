
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Download, Search, Eye, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TransactionWithDetails = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  name: string;
  category: string | null;
  note: string | null;
  created_at: string;
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
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
  const [statusUpdateReason, setStatusUpdateReason] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      console.log('Fetching transactions as admin...');
      
      const { data: response, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'get_all_transactions'
        }
      });

      if (error) {
        console.error('Error fetching transactions via edge function:', error);
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
        return;
      }

      console.log('Edge function successful, transactions found:', response?.transactions?.length || 0);
      setTransactions(response?.transactions || []);
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
    setActionLoading(`update-${transactionId}`);
    try {
      console.log('Updating transaction status:', { transactionId, newStatus, reason });

      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction && transaction.status === 'pending' && newStatus === 'completed') {
        await handlePendingTransferApproval(transaction);
      }
      
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        const existingNote = transaction?.note || '';
        updateData.note = `${existingNote}\n[Admin Update: ${reason}]`.trim();
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId);

      if (error) {
        console.error('Error updating transaction:', error);
        throw new Error(error.message || 'Failed to update transaction');
      }

      toast({
        title: "Success",
        description: `Transaction ${newStatus === 'completed' ? 'approved' : newStatus}`,
      });
      
      await fetchTransactions();
      setShowStatusModal(false);
      setStatusUpdateReason("");
      setNewStatus("");
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePendingTransferApproval = async (transaction: TransactionWithDetails) => {
    try {
      console.log('Handling pending transfer approval for transaction:', transaction.id);
      
      const { data: transfers, error: transferError } = await supabase
        .from('money_transfers')
        .select('*')
        .eq('amount', Math.round(transaction.amount * 100))
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (transferError || !transfers || transfers.length === 0) {
        console.error('Transfer record not found:', transferError);
        return;
      }

      const transfer = transfers[0];

      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transfer.sender_id)
        .single();

      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transfer.recipient_id)
        .single();

      if (!senderWallet || !recipientWallet) {
        throw new Error('Sender or recipient wallet not found');
      }

      const newRecipientBalance = Number(recipientWallet.balance) + Number(transaction.amount);

      await Promise.all([
        supabase
          .from('wallets')
          .update({ balance: newRecipientBalance, updated_at: new Date().toISOString() })
          .eq('id', recipientWallet.id),
        supabase
          .from('money_transfers')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', transfer.id)
      ]);

      console.log('Transfer approved and balances updated');
    } catch (error) {
      console.error('Error handling pending transfer approval:', error);
      throw error;
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
    
    return matchesSearch && matchesStatus && matchesType;
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
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading transactions...</p>
      </div>
    );
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
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
              <TableRow key={transaction.id} className={transaction.status === 'pending' ? 'bg-yellow-50' : ''}>
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
                  {transaction.amount > 100 && transaction.status === 'pending' && (
                    <div className="text-xs text-yellow-600 mt-1">Requires approval</div>
                  )}
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
                    {transaction.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => updateTransactionStatus(transaction.id, 'completed', 'Admin approved')}
                        disabled={actionLoading === `update-${transaction.id}`}
                      >
                        {actionLoading === `update-${transaction.id}` ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        ) : (
                          'Approve'
                        )}
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowStatusModal(true);
                      }}
                      disabled={actionLoading === `update-${transaction.id}`}
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
            <DialogDescription>
              View detailed information about this transaction
            </DialogDescription>
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
            <DialogDescription>
              Change the status of this transaction
            </DialogDescription>
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
                disabled={!newStatus || actionLoading === `update-${selectedTransaction?.id}`}
              >
                {actionLoading === `update-${selectedTransaction?.id}` ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : null}
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
