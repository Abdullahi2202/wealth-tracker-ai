
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { CreditCard, ArrowUp, ArrowDown, Send, Wallet, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// BalanceCard with quick action buttons grid!
const BalanceCard = ({ totalBalance, currency = "$" }: { totalBalance: number; currency?: string }) => (
  <Card
    className="wallet-card w-full shadow-2xl rounded-2xl border-none relative overflow-hidden bg-gradient-to-tr from-blue-600 to-fuchsia-700 text-white"
  >
    <CardContent className="p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase font-bold tracking-widest text-white/80 mb-1">Total Balance</div>
          <div className="text-3xl md:text-4xl font-extrabold mb-1 tracking-tight flex items-end">
            {currency}
            {totalBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-sm opacity-90">Available across all accounts</div>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <CreditCard className="h-7 w-7 text-white opacity-90" />
        </div>
      </div>
      <div className="mt-6 flex justify-between gap-6">
        <div>
          <div className="text-xs opacity-80">This Month's Income</div>
          <div className="text-lg font-semibold">{currency}3,580.00</div>
        </div>
        <div>
          <div className="text-xs opacity-80">This Month's Expenses</div>
          <div className="text-lg font-semibold">{currency}2,149.25</div>
        </div>
      </div>
      <div className="flex gap-3 mt-7">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-white font-semibold shadow focus:outline-none backdrop-blur text-sm">
          <Send className="h-4 w-4" />
          Pay
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-white font-semibold shadow focus:outline-none backdrop-blur text-sm">
          <ArrowDown className="h-4 w-4" />
          Receive
        </button>
      </div>
      {/* Quick Action Grid */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
          <ArrowUp className="mb-0.5" />
          <span className="text-xs mt-0.5 font-medium">Top Up</span>
        </button>
        <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
          <ArrowDown className="mb-0.5" />
          <span className="text-xs mt-0.5 font-medium">Transfer</span>
        </button>
        <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
          <QrCode className="mb-0.5" />
          <span className="text-xs mt-0.5 font-medium">QR Code</span>
        </button>
        <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
          <Wallet className="mb-0.5" />
          <span className="text-xs mt-0.5 font-medium">Wallet</span>
        </button>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("walletmaster_user");
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUserName(userObj.name || "");
      } catch {
        setUserName("");
      }
    }
  }, []);

  return (
    <DashboardLayout>
      <div
        className="min-h-[100dvh] w-full flex flex-col items-center
          bg-gradient-to-tr from-violet-100 via-blue-50 to-pink-50
          px-0 pt-7 md:pt-12 animate-fade-in
          overflow-x-hidden"
        style={{
          maxWidth: '100vw', 
          minHeight: '100dvh',
          height: '100dvh', // force mobile browser fit
        }}
      >
        {/* Greeting */}
        <div className="w-full max-w-full text-center px-3 md:px-0 mb-4">
          <h2 className="font-bold text-2xl md:text-3xl text-finance-purple mb-3">
            {userName && (
              <>Welcome back, <span className="font-extrabold text-finance-blue">{userName}</span>!</>
            )}
            {!userName && <>Welcome to <span className="text-finance-blue">WalletMaster</span>!</>}
          </h2>
          <p className="text-md md:text-lg text-zinc-500/90 max-w-xs md:max-w-xl mx-auto">
            Manage your finances with insights, analytics, and fast payments.
          </p>
        </div>
        {/* Main balance card */}
        <div className="w-full flex justify-center px-0 pb-3">
          <div className="w-full max-w-[420px]">
            <BalanceCard totalBalance={4931.17} currency="$" />
          </div>
        </div>
        {/* Empty space for bottom nav, so card never touches the nav */}
        <div className="grow" />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
