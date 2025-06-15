
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, DollarSign, TrendingUp, AlertTriangle, Search, Filter, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  name: string;
  category: string | null;
  note: string | null;
  created_at: string;
  user: {
    email: string;
    full_name: string;
  };
}

const TransactionMonitoring = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("24h");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
    
    // Set up real-time subscription for transaction monitoring
    const channel = supabase
      .channel('transaction-monitoring')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaction change detected:', payload);
          fetchTransactions(); // Refresh data on any transaction change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter, timeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          amount,
          type,
          name,
          category,
          note,
          created_at,
          user:users!transactions_user_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data || []);
        generateChartData(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Time filter
    const now = new Date();
    const timeFilters = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    if (timeFilter !== 'all') {
      const cutoffTime = new Date(now.getTime() - timeFilters[timeFilter as keyof typeof timeFilters]);
      filtered = filtered.filter(t => new Date(t.created_at) >= cutoffTime);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const generateChartData = (data: Transaction[]) => {
    // Group transactions by hour for the last 24 hours
    const hourlyData = new Array(24).fill(0).map((_, index) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - index), 0, 0, 0);
      return {
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit' }),
        amount: 0,
        count: 0
      };
    });

    data.forEach(transaction => {
      const transactionTime = new Date(transaction.created_at);
      const hourDiff = Math.floor((Date.now() - transactionTime.getTime()) / (1000 * 60 * 60));
      
      if (hourDiff >= 0 && hourDiff < 24) {
        const index = 23 - hourDiff;
        hourlyData[index].amount += transaction.amount;
        hourlyData[index].count += 1;
      }
    });

    setChartData(hourlyData);
  };

  const calculateMetrics = () => {
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = filteredTransactions.length;
    const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;
    
    // Calculate suspicious transactions (high amounts or unusual patterns)
    const suspiciousTransactions = filteredTransactions.filter(t => t.amount > 10000).length;
    
    return {
      totalAmount,
      transactionCount,
      averageAmount,
      suspiciousTransactions
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading transaction monitoring...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Transaction Monitoring</h2>
          <p className="text-sm text-muted-foreground">Real-time transaction tracking and analysis</p>
        </div>
        <Button variant="outline" onClick={fetchTransactions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Transaction volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Count</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.transactionCount}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.averageAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.suspiciousTransactions}</div>
            <p className="text-xs text-muted-foreground">High-value transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Transaction Count (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
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
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.user?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{transaction.user?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.category && `${transaction.category} • `}
                        {transaction.id.substring(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    <span className={transaction.amount > 10000 ? 'text-red-600 font-bold' : ''}>
                      ${transaction.amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionMonitoring;
