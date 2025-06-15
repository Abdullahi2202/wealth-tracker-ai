import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, TrendingUp, AlertCircle, CheckCircle, DollarSign, UserCheck, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  total_users: number;
  verified_users: number;
  total_wallet_balance: number;
  total_transactions: number;
  total_payments: number;
  successful_payments: number;
  recent_signups: number;
}

const OverviewDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    userGrowth: [],
    transactionTrends: [],
    paymentMethods: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('admin-operations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (error) {
          console.error('Error fetching stats:', error);
          return;
        }

        setStats(data);
        await fetchChartData();
      } catch (error) {
        console.error('Error calling admin function:', error);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  const fetchChartData = async () => {
    try {
      // Fetch user growth data via 'registration'
      const { data: userGrowthData } = await supabase
        .from('registration')
        .select('created_at')
        .order('created_at', { ascending: true });

      // Process user growth data by month
      const monthlyGrowth = userGrowthData?.reduce((acc: any[], user) => {
        const month = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short' });
        const existingMonth = acc.find(item => item.month === month);
        if (existingMonth) {
          existingMonth.users += 1;
        } else {
          acc.push({ month, users: 1 });
        }
        return acc;
      }, []) || [];

      // Fetch transaction trends data - using transactions table instead of payment_transactions
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Process transaction data by day
      const dailyTransactions = transactionData?.reduce((acc: any[], transaction) => {
        const day = new Date(transaction.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        const existingDay = acc.find(item => item.day === day);
        if (existingDay) {
          existingDay.amount += transaction.amount;
        } else {
          acc.push({ day, amount: transaction.amount });
        }
        return acc;
      }, []) || [];

      // Fetch payment methods data - using payment_methods table instead of stored_payment_methods
      const { data: paymentMethodsData } = await supabase
        .from('payment_methods')
        .select('brand');

      const methodDistribution = paymentMethodsData?.reduce((acc: any[], method) => {
        const brand = method.brand || 'Unknown';
        const existing = acc.find(item => item.name === brand);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: brand, value: 1, color: getColorForBrand(brand) });
        }
        return acc;
      }, []) || [];

      setChartData({
        userGrowth: monthlyGrowth.slice(-6), // Last 6 months
        transactionTrends: dailyTransactions,
        paymentMethods: methodDistribution
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const getColorForBrand = (brand: string) => {
    const colors: Record<string, string> = {
      'visa': '#1A1F71',
      'mastercard': '#EB001B',
      'amex': '#006FCF',
      'discover': '#FF6000',
      'Unknown': '#6B7280'
    };
    return colors[brand.toLowerCase()] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading dashboard overview...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Unable to load dashboard data</p>
      </div>
    );
  }

  const verificationRate = stats.total_users > 0 
    ? ((stats.verified_users / stats.total_users) * 100).toFixed(1)
    : "0";

  const successRate = stats.total_payments > 0 
    ? ((stats.successful_payments / stats.total_payments) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recent_signups} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified_users}</div>
            <p className="text-xs text-muted-foreground">
              {verificationRate}% verification rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.total_wallet_balance / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Payment success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.paymentMethods.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData.paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {chartData.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {chartData.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: method.color }}
                        />
                        <span className="text-sm">{method.name}</span>
                      </div>
                      <span className="text-sm font-medium">{method.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payment methods found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Status</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Gateway</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Available
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registrations</p>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </div>
                <Badge variant="secondary">{stats.recent_signups}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Successful payments</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <Badge variant="secondary">{stats.successful_payments}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pending verifications</p>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </div>
                <Badge variant="secondary">{stats.total_users - stats.verified_users}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewDashboard;
