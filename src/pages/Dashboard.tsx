import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import BalanceCard from "@/components/dashboard/BalanceCard";
import { supabase } from "@/integrations/supabase/client";
import TransactionDrawer from "@/components/transactions/TransactionDrawer";
import { useState } from "react";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  date: string;
  // ...any other fields
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
      // Fetch all user's transactions from Supabase
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, type, date")
        .eq("email", userEmail)
        .order("date", { ascending: false });

      if (!error && Array.isArray(data)) {
        setTransactions(data);

        // Calculate current month
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        let balance = 0;
        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        data.forEach((txn) => {
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

  return (
    <DashboardLayout>
      <div
        className="min-h-[100dvh] w-full flex flex-col items-center
          bg-gradient-to-tr from-violet-100 via-blue-50 to-pink-50
          px-0 pt-7 md:pt-12 animate-fade-in
          overflow-x-hidden"
        style={{
          maxWidth: "100vw",
          minHeight: "100dvh",
          height: "100dvh", // force mobile browser fit
        }}
      >
        {/* Greeting */}
        <div className="w-full max-w-full text-center px-3 md:px-0 mb-4">
          <h2 className="font-bold text-2xl md:text-3xl text-finance-purple mb-3">
            {userName && (
              <>
                Welcome back,{" "}
                <span className="font-extrabold text-finance-blue">{userName}</span>!
              </>
            )}
            {!userName && (
              <>
                Welcome to <span className="text-finance-blue">WalletMaster</span>!
              </>
            )}
          </h2>
          <p className="text-md md:text-lg text-zinc-500/90 max-w-xs md:max-w-xl mx-auto">
            Manage your finances with insights, analytics, and fast payments.
          </p>
        </div>
        {/* Main balance card */}
        <div className="w-full flex justify-center px-0 pb-3">
          <div className="w-full max-w-[420px] flex flex-col gap-2">
            <BalanceCard
              totalBalance={loading ? 0 : totalBalance}
              currency="$"
              monthIncome={loading ? 0 : monthIncome}
              monthExpenses={loading ? 0 : monthExpenses}
              loading={loading}
            />
            <Button onClick={() => setDrawerOpen(true)} className="mt-2 w-full">
              + Add Transaction
            </Button>
            <TransactionDrawer open={drawerOpen} onOpenChange={setDrawerOpen} onSaved={() => window.location.reload()} />
          </div>
        </div>
        {/* Optional: Empty space for bottom nav */}
        <div className="grow" />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
