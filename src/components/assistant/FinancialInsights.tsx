
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  topSpendingCategory: string;
  savingsRate: number;
  spendingTrend: 'up' | 'down' | 'stable';
  budgetHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export default function FinancialInsights() {
  const [insights, setInsights] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setError(null);
        // Get current auth user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setError("Please log in to view your financial insights");
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Get wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        const walletBalance = walletData?.balance || 0;

        // Get current month transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, category, type, date')
          .eq('user_id', userId)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .order('date', { ascending: false });

        // Get previous month for trend analysis
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        
        const { data: prevTransactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('user_id', userId)
          .gte('date', prevMonthStart)
          .lte('date', prevMonthEnd);

        if (!transactions) {
          setInsights({
            totalBalance: Number(walletBalance),
            monthlyIncome: 0,
            monthlyExpenses: 0,
            topSpendingCategory: 'None',
            savingsRate: 0,
            spendingTrend: 'stable',
            budgetHealth: 'excellent'
          });
          setLoading(false);
          return;
        }

        // Calculate current month insights
        const monthlyIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthlyExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Calculate previous month expenses for trend
        const prevMonthExpenses = prevTransactions?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Determine spending trend
        let spendingTrend: 'up' | 'down' | 'stable' = 'stable';
        if (prevMonthExpenses > 0) {
          const changePercentage = ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
          if (changePercentage > 10) spendingTrend = 'up';
          else if (changePercentage < -10) spendingTrend = 'down';
        }

        // Find top spending category
        const categoryTotals: Record<string, number> = {};
        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const category = t.category || 'Miscellaneous';
            categoryTotals[category] = (categoryTotals[category] || 0) + Number(t.amount);
          });

        const topCategory = Object.entries(categoryTotals)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

        const savingsRate = monthlyIncome > 0 ? 
          ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

        // Determine budget health
        let budgetHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
        if (savingsRate < 0) budgetHealth = 'critical';
        else if (savingsRate < 10) budgetHealth = 'warning';
        else if (savingsRate < 20) budgetHealth = 'good';

        setInsights({
          totalBalance: Number(walletBalance),
          monthlyIncome,
          monthlyExpenses,
          topSpendingCategory: topCategory,
          savingsRate,
          spendingTrend,
          budgetHealth
        });
      } catch (error) {
        console.error('Error fetching financial insights:', error);
        setError('Unable to load financial insights. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <p className="text-muted-foreground">No financial data available</p>
        </CardContent>
      </Card>
    );
  }

  const getBudgetHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSpendingTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${insights.totalBalance.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Available funds</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${insights.monthlyIncome.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">This month's earnings</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          {getSpendingTrendIcon(insights.spendingTrend)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">${insights.monthlyExpenses.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Trend: {insights.spendingTrend === 'up' ? 'Increasing' : insights.spendingTrend === 'down' ? 'Decreasing' : 'Stable'}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getBudgetHealthColor(insights.budgetHealth)}`}>
            {insights.savingsRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Budget: <span className={getBudgetHealthColor(insights.budgetHealth)}>{insights.budgetHealth}</span>
          </p>
          <p className="text-xs text-muted-foreground">Top: {insights.topSpendingCategory}</p>
        </CardContent>
      </Card>
    </div>
  );
}
