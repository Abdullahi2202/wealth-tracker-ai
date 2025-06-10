
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Transaction = {
  id: string;
  email: string;
  name: string;
  amount: number;
  type: string;
  date: string;
  created_at: string;
  category?: string;
  recipient_email?: string;
  sender_email?: string;
  note?: string;
};

const TransactionMonitoring = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('transaction-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaction change:', payload);
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as Transaction, ...prev]);
            toast.success("New transaction detected");
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev => prev.map(t => 
              t.id === payload.new.id ? payload.new as Transaction : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to fetch transactions");
      } else {
        setTransactions(data || []);
        toast.success("Transactions loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
    }
    setLoading(false);
  };

  const refreshTransactions = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
    toast.success("Transactions refreshed");
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income": return "bg-green-100 text-green-800";
      case "expense": return "bg-red-100 text-red-800";
      case "transfer": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateMetrics = () => {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const incomeTransactions = transactions.filter(t => t.type === "income");
    const expenseTransactions = transactions.filter(t => t.type === "expense");
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalTransactions: transactions.length,
      totalAmount,
      totalIncome,
      totalExpense
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Real-time updates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All transaction volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${metrics.totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Income transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${metrics.totalExpense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Expense transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search transactions by email, name, or recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={refreshTransactions}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.created_at).toLocaleDateString()} {' '}
                  {new Date(transaction.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-medium">{transaction.email}</TableCell>
                <TableCell>{transaction.name}</TableCell>
                <TableCell>
                  <Badge className={getTypeColor(transaction.type)}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  <span className={transaction.type === 'income' ? 'text-green-600' : transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'}>
                    ${transaction.amount.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>{transaction.recipient_email || "-"}</TableCell>
                <TableCell>{transaction.category || "-"}</TableCell>
                <TableCell>{transaction.note || "-"}</TableCell>
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
    </div>
  );
};

export default TransactionMonitoring;
