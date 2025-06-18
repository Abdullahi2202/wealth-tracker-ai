
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  topSpendingCategory: string;
  savingsRate: number;
}

export default function FinancialInsights() {
  const [insights, setInsights] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Get current auth user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
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
        
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, category, type')
          .eq('user_id', userId)
          .gte('date', startOfMonth);

        if (!transactions) {
          setInsights({
            totalBalance: Number(walletBalance),
            monthlyIncome: 0,
            monthlyExpenses: 0,
            topSpendingCategory: 'None',
            savingsRate: 0
          });
          setLoading(false);
          return;
        }

        // Calculate insights
        const monthlyIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthlyExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Find top spending category
        const categoryTotals: Record<string, number> = {};
        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const category = t.category || 'Misc';
            categoryTotals[category] = (categoryTotals[category] || 0) + Number(t.amount);
          });

        const topCategory = Object.entries(categoryTotals)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

        const savingsRate = monthlyIncome > 0 ? 
          ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

        setInsights({
          totalBalance: Number(walletBalance),
          monthlyIncome,
          monthlyExpenses,
          topSpendingCategory: topCategory,
          savingsRate
        });
      } catch (error) {
        console.error('Error fetching financial insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading insights...</div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No financial data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${insights.totalBalance.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${insights.monthlyIncome.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">${insights.monthlyExpenses.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${insights.savingsRate >= 20 ? 'text-green-600' : insights.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {insights.savingsRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Top category: {insights.topSpendingCategory}</p>
        </CardContent>
      </Card>
    </div>
  );
}
