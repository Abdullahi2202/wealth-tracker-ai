
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import WalletBalanceCard from "@/components/dashboard/WalletBalanceCard";
import IncomeExpenseSummary from "@/components/dashboard/IncomeExpenseSummary";
import { supabase } from "@/integrations/supabase/client";
import TransactionDrawer from "@/components/transactions/TransactionDrawer";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import DashboardQuickLinks from "@/components/dashboard/DashboardQuickLinks";

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

        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        typedTransactions.forEach((txn) => {
          const txnDate = new Date(txn.date);
          if (
            txnDate.getMonth() === month &&
            txnDate.getFullYear() === year
          ) {
            if (txn.type === "income") {
              monthlyIncome += Number(txn.amount);
            } else if (txn.type === "expense") {
              monthlyExpenses += Number(txn.amount);
            }
          }
        });

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
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {userName ? `Welcome, ${userName}` : "WalletMaster"}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Wallet Balance Card */}
          <div className="mb-6">
            <WalletBalanceCard />
          </div>

          {/* Income/Expense Summary */}
          <div className="mb-6">
            <IncomeExpenseSummary
              monthIncome={monthIncome}
              monthExpenses={monthExpenses}
              loading={loading}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <DashboardQuickLinks />
          </div>

          {/* Add Transaction Button */}
          <div className="mb-6">
            <Button 
              onClick={() => setDrawerOpen(true)} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              size="lg"
            >
              + Add Transaction
            </Button>
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
