
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import CombinedWalletCard from "@/components/dashboard/CombinedWalletCard";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className={`container mx-auto px-2 py-2 ${isMobile ? 'max-w-full' : 'max-w-4xl'}`}>
          {/* Header Section - Mobile Optimized */}
          <div className="mb-4">
            <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
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

          {/* Combined Wallet Card - Mobile Optimized */}
          <div className="w-full">
            <CombinedWalletCard
              monthIncome={monthIncome}
              monthExpenses={monthExpenses}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
