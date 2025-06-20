
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, AlertTriangle, FileText, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUsers: number;
  activeCards: number;
  pendingVerifications: number;
  totalTransactions: number;
  monthlyRevenue: number;
  fraudAlerts: number;
}

const OverviewDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeCards: 0,
    pendingVerifications: 0,
    totalTransactions: 0,
    monthlyRevenue: 0,
    fraudAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get total users from registration table
      const { count: totalUsers } = await supabase
        .from('registration')
        .select('*', { count: 'exact', head: true });

      // Get pending identity verifications
      const { count: pendingVerifications } = await supabase
        .from('identity_verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get total transactions
      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // Get current month transactions for revenue calculation
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: monthlyTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('created_at', startOfMonth.toISOString());

      // Get fraud alerts
      const { count: fraudAlerts } = await supabase
        .from('fraud_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get payment methods count
      const { count: activeCards } = await supabase
        .from('payment_methods')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const monthlyRevenue = monthlyTransactions?.reduce((sum, transaction) => 
        sum + (Number(transaction.amount) || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeCards: activeCards || 0,
        pendingVerifications: pendingVerifications || 0,
        totalTransactions: totalTransactions || 0,
        monthlyRevenue,
        fraudAlerts: fraudAlerts || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Active Cards",
      value: stats.activeCards,
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      icon: FileText,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Total Transactions",
      value: stats.totalTransactions,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Fraud Alerts",
      value: stats.fraudAlerts,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <Button onClick={fetchDashboardStats} variant="outline">
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <Button onClick={fetchDashboardStats} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          const numericValue = typeof stat.value === 'number' ? stat.value : 0;
          
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.title === "Fraud Alerts" && numericValue > 0 && (
                  <Badge variant="destructive" className="mt-2">
                    Requires Attention
                  </Badge>
                )}
                {stat.title === "Pending Verifications" && numericValue > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    Needs Review
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default OverviewDashboard;
