
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import BalanceCard from "@/components/dashboard/BalanceCard";
import WalletBalanceCard from "@/components/dashboard/WalletBalanceCard";
import { supabase } from "@/integrations/supabase/client";
import TransactionDrawer from "@/components/transactions/TransactionDrawer";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import DashboardQuickLinks from "@/components/dashboard/DashboardQuickLinks";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  date: string;
  name: string;
  category?: string;
};

const Dashboard = () => {
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculated values
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthExpenses, setMonthExpenses] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { wallet } = useWallet();

  useEffect(() => {
    // Get user from localStorage (set by Login)
    const storedUser = localStorage.getItem("walletmaster_user");
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUserName(userObj.name || "");
        setUserEmail(userObj.email || "");
      } catch {
        setUserName("");
        setUserEmail("");
      }
    }
  }, []);

  useEffect(() => {
    // Only fetch if userEmail is available
    if (!userEmail) return;

    const fetchTransactions = async () => {
      setLoading(true);
      // Fetch all user's transactions from Supabase with explicit typing
      const { data: transactionData, error } = await supabase
        .from("transactions")
        .select("id, amount, type, date, name, category")
        .eq("user_id", userEmail)
        .order("date", { ascending: false });

      if (!error && Array.isArray(transactionData)) {
        const typedTransactions: Transaction[] = transactionData.map(item => ({
          id: item.id,
          amount: Number(item.amount),
          type: String(item.type),
          date: String(item.date),
          name: String(item.name),
          category: item.category ? String(item.category) : undefined
        }));
        
        setTransactions(typedTransactions);

        // Calculate current month
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        let balance = 0;
        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        typedTransactions.forEach((txn) => {
          const txnDate = new Date(txn.date);
          if (txn.type === "income") {
            balance += Number(txn.amount);
            if (
              txnDate.getMonth() === month &&
              txnDate.getFullYear() === year
            ) {
              monthlyIncome += Number(txn.amount);
            }
          } else if (txn.type === "expense") {
            balance -= Number(txn.amount);
            if (
              txnDate.getMonth() === month &&
              txnDate.getFullYear() === year
            ) {
              monthlyExpenses += Number(txn.amount);
            }
          }
        });

        setTotalBalance(balance);
        setMonthIncome(monthlyIncome);
        setMonthExpenses(monthlyExpenses);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [userEmail]);

  const handleRefreshData = () => {
    if (userEmail) {
      const fetchTransactions = async () => {
        setLoading(true);
        const { data: transactionData, error } = await supabase
          .from("transactions")
          .select("id, amount, type, date, name, category")
          .eq("user_id", userEmail)
          .order("date", { ascending: false });

        if (!error && Array.isArray(transactionData)) {
          const typedTransactions: Transaction[] = transactionData.map(item => ({
            id: item.id,
            amount: Number(item.amount),
            type: String(item.type),
            date: String(item.date),
            name: String(item.name),
            category: item.category ? String(item.category) : undefined
          }));
          
          setTransactions(typedTransactions);
        }
        setLoading(false);
      };
      fetchTransactions();
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userName ? `Welcome back, ${userName}` : "Welcome to WalletMaster"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <Button
                onClick={handleRefreshData}
                variant="outline"
                className="hidden md:flex"
              >
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Balance Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Wallet Balance - Full width on mobile, spans 2 columns on lg */}
            <div className="lg:col-span-2">
              <WalletBalanceCard className="h-full" />
            </div>
            
            {/* Main Balance Card */}
            <div className="lg:col-span-1">
              <BalanceCard
                totalBalance={loading ? 0 : totalBalance}
                currency="$"
                monthIncome={loading ? 0 : monthIncome}
                monthExpenses={loading ? 0 : monthExpenses}
                loading={loading}
                className="h-full"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <DashboardQuickLinks />
          </div>

          {/* Add Transaction Button */}
          <div className="mb-8">
            <Button 
              onClick={() => setDrawerOpen(true)} 
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              size="lg"
            >
              + Add Transaction
            </Button>
          </div>

          {/* Recent Transactions */}
          <div className="mb-8">
            <RecentTransactions 
              transactions={transactions.slice(0, 5)} 
              loading={loading}
            />
          </div>

          <TransactionDrawer 
            open={drawerOpen} 
            onOpenChange={setDrawerOpen} 
            onSaved={() => {
              handleRefreshData();
              setDrawerOpen(false);
            }} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
