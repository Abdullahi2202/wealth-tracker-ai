
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

interface ProfileData {
  id: string;
}

interface WalletData {
  balance: number;
}

interface TransactionData {
  amount: number;
  category: string | null;
  type: string;
}

export default function FinancialInsights() {
  const [insights, setInsights] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const storedUser = localStorage.getItem("walletmaster_user");
        if (!storedUser) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(storedUser);
        const email = user.email;
        if (!email) {
          setLoading(false);
          return;
        }

        // Step 1: Get user profile with explicit typing
        const profileResponse = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email);

        if (profileResponse.error) {
          console.error('Profile query error:', profileResponse.error);
          setLoading(false);
          return;
        }

        const profiles = profileResponse.data as ProfileData[];
        if (!profiles || profiles.length === 0) {
          console.error('No profile found for email:', email);
          setLoading(false);
          return;
        }

        const profileId = profiles[0].id;

        // Step 2: Get wallet balance
        const walletResponse = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', profileId);

        const wallets = walletResponse.data as WalletData[];
        const walletBalance = wallets && wallets.length > 0 ? wallets[0].balance : 0;

        // Step 3: Get current month transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const transactionsResponse = await supabase
          .from('transactions')
          .select('amount, category, type')
          .eq('user_id', profileId)
          .gte('date', startOfMonth);

        if (transactionsResponse.error) {
          console.error('Transactions query error:', transactionsResponse.error);
          setLoading(false);
          return;
        }

        const transactions = transactionsResponse.data as TransactionData[] || [];

        // Calculate insights
        const monthlyIncome = transactions
          .filter((t: TransactionData) => t.type === 'income')
          .reduce((sum: number, t: TransactionData) => sum + Number(t.amount), 0);

        const monthlyExpenses = transactions
          .filter((t: TransactionData) => t.type === 'expense')
          .reduce((sum: number, t: TransactionData) => sum + Number(t.amount), 0);

        // Find top spending category
        const categoryTotals: Record<string, number> = {};
        transactions
          .filter((t: TransactionData) => t.type === 'expense')
          .forEach((t: TransactionData) => {
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
