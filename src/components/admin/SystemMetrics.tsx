
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface DashboardStats {
  total_users: number;
  verified_users: number;
  total_wallet_balance: number;
  total_transactions: number;
  total_payments: number;
  successful_payments: number;
  recent_signups: number;
}

const SystemMetrics = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
        } else {
          setStats(data);
        }
      } catch (error) {
        console.error('Error calling admin function:', error);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading system metrics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Unable to load system metrics</p>
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
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recent_signups} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
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
            <CardTitle className="text-sm font-medium">Total Wallet Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.total_wallet_balance / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all user wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_transactions}</div>
            <p className="text-xs text-muted-foreground">
              Total transaction logs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Payments</span>
              <Badge variant="secondary">{stats.total_payments}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Successful</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {stats.successful_payments}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Success Rate</span>
              <Badge variant="outline">{successRate}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">This Week</span>
              <Badge className="bg-blue-100 text-blue-800">
                +{stats.recent_signups}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification Rate</span>
              <Badge variant="outline">{verificationRate}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment System</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Registration</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Administrative Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">User Management</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {stats.total_users} total registered users</li>
                <li>• {stats.verified_users} verified accounts</li>
                <li>• {stats.total_users - stats.verified_users} pending verification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Financial Overview</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• ${(stats.total_wallet_balance / 100).toFixed(2)} total wallet funds</li>
                <li>• {stats.total_transactions} transaction records</li>
                <li>• {stats.successful_payments} successful payments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMetrics;
