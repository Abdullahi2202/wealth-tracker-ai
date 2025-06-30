import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, DollarSign, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  totalTransactionValue: number;
  activeCards: number;
  pendingTransactions: number;
  failedTransactions: number;
  recentTransactions: any[];
}

const OverviewDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTransactions: 0,
    totalTransactionValue: 0,
    activeCards: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      console.log('Fetching dashboard statistics...');

      // Fetch users using admin-operations edge function
      const { data: usersResponse, error: usersError } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_all_users' }
      });

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Fetch transactions using admin-operations edge function
      const { data: transactionsResponse, error: transactionsError } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_all_transactions' }
      });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      }

      // Fetch active cards count with service role permissions
      const { count: cardsCount, error: cardsError } = await supabase
        .from('payment_methods')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (cardsError) {
        console.error('Error fetching cards count:', cardsError);
      }

      // Process the data
      const users = usersResponse?.users || [];
      const transactions = transactionsResponse?.transactions || [];

      // Calculate statistics
      const totalTransactionValue = transactions.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
      const pendingTransactions = transactions.filter((t: any) => t.status === 'pending').length;
      const failedTransactions = transactions.filter((t: any) => t.status === 'failed').length;
      const recentTransactions = transactions.slice(0, 5);

      setStats({
        totalUsers: users.length,
        totalTransactions: transactions.length,
        totalTransactionValue,
        activeCards: cardsCount || 0,
        pendingTransactions,
        failedTransactions,
        recentTransactions
      });

      console.log('Dashboard stats loaded:', {
        totalUsers: users.length,
        totalTransactions: transactions.length,
        totalTransactionValue,
        activeCards: cardsCount
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            <Activity className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">All time transactions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Transaction Volume</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${stats.totalTransactionValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total value processed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Cards</CardTitle>
            <CreditCard className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeCards.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Payment methods</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Transactions</CardTitle>
            <TrendingUp className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingTransactions.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed Transactions</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.failedTransactions.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentTransactions.map((transaction, index) => (
                <div key={transaction.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{transaction.name}</div>
                    <div className="text-sm text-gray-500">
                      {transaction.user_name || 'Unknown User'} • {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      ${Number(transaction.amount).toFixed(2)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewDashboard;
