import { Card, CardContent } from "@/components/ui/card";
import { Wallet, RefreshCw, TrendingUp, TrendingDown, Eye, EyeOff, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/useWallet";
import { useWalletNumber } from "@/hooks/useWalletNumber";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CombinedWalletCardProps {
  monthIncome: number;
  monthExpenses: number;
  loading: boolean;
}

const CombinedWalletCard = ({ monthIncome, monthExpenses, loading }: CombinedWalletCardProps) => {
  const { wallet, balance, loading: walletLoading, refetch } = useWallet();
  const { walletNumber } = useWalletNumber();
  const [showBalance, setShowBalance] = useState(true);
  const [financialData, setFinancialData] = useState({
    monthIncome: 0,
    monthExpenses: 0,
    loading: true
  });
  const navigate = useNavigate();

  // Fetch financial data from backend
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get current month transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth);

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        const income = transactions
          ?.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const expenses = transactions
          ?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        setFinancialData({
          monthIncome: income,
          monthExpenses: expenses,
          loading: false
        });
      } catch (error) {
        console.error('Error in fetchFinancialData:', error);
        setFinancialData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchFinancialData();
  }, []);

  // Use fetched data instead of props
  const actualMonthIncome = financialData.monthIncome;
  const actualMonthExpenses = financialData.monthExpenses;
  const netIncome = actualMonthIncome - actualMonthExpenses;
  const isPositive = netIncome >= 0;

  const handleRefresh = () => {
    refetch();
    // Refetch financial data as well
    setFinancialData(prev => ({ ...prev, loading: true }));
    const fetchFinancialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth);

        if (!error && transactions) {
          const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          setFinancialData({
            monthIncome: income,
            monthExpenses: expenses,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error refreshing financial data:', error);
        setFinancialData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchFinancialData();
  };

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  const quickActions = [
    {
      title: "Cards",
      icon: CreditCard,
      color: "bg-indigo-500 hover:bg-indigo-600",
      action: () => navigate("/cards"),
    },
  ];

  if (walletLoading || financialData.loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white overflow-hidden">
      <CardContent className="p-0">
        {/* Wallet Balance Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-100">Digital Wallet</h3>
                  <p className="text-xs text-blue-200">Available Balance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleBalanceVisibility}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2"
                >
                  {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={walletLoading || financialData.loading}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2"
                >
                  <RefreshCw className={`h-4 w-4 ${(walletLoading || financialData.loading) ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-4xl font-bold text-white">
                  {showBalance ? (
                    `$${balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  ) : (
                    "••••••"
                  )}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-300" />
                  <span className="text-green-300">Available for spending</span>
                </div>
              </div>

              {wallet && (
                <div className="pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-200">Wallet ID</p>
                      <p className="text-white font-medium">
                        {wallet.user_phone || walletNumber || `#${wallet.wallet_number}` || 'N/A'}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-blue-200">Last Updated</p>
                      <p className="text-white font-medium">
                        {new Date(wallet.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Income/Expense Summary Section */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Monthly Income */}
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Income</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                ${actualMonthIncome.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            {/* Monthly Expenses */}
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Expenses</span>
              </div>
              <p className="text-xl font-bold text-red-600">
                ${actualMonthExpenses.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>

          {/* Net Income */}
          <div className={`p-3 rounded-lg text-center ${isPositive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <span className="text-sm font-medium text-gray-700">Net Amount</span>
            <p className={`text-lg font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
              {isPositive ? '+' : ''}${netIncome.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={action.action}
                className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200 active:scale-95"
              >
                <div className={`p-3 rounded-full text-white ${action.color} transition-colors duration-200`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <p className="font-medium text-gray-900 text-sm">{action.title}</p>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CombinedWalletCard;
