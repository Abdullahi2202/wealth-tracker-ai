import { useEffect, useState } from "react";
import { CreditCard, ArrowUp, ArrowDown, Send, Wallet, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
// import ExpenseChart from "@/components/dashboard/ExpenseChart"; <-- removed, as per instructions

const BalanceCard = ({ totalBalance, currency = "$" }: { totalBalance: number; currency?: string }) => {
  return (
    <Card
      className="wallet-card text-white w-full max-w-md mx-auto shadow-xl rounded-2xl p-0"
      style={{
        background: "linear-gradient(135deg, #4361ee 0%, #7209b7 100%)",
        borderRadius: "18px",
        boxShadow: "0 8px 32px rgba(114, 9, 183, 0.18)"
      }}
    >
      <CardContent className="p-7">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold opacity-90 mb-0.5">Total Balance</p>
            <h3 className="text-4xl font-extrabold mt-1 tracking-tight">
              {currency}
              {totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <p className="text-[14px] mt-4 opacity-90">Available across all accounts</p>
          </div>
          <div className="bg-white/25 p-3 rounded-full">
            <CreditCard className="h-7 w-7 text-white opacity-90" />
          </div>
        </div>
        <hr className="border-white/20 my-5" />
        <div className="flex justify-between mb-5">
          <div>
            <p className="text-xs opacity-80">This Month's Income</p>
            <p className="text-lg font-semibold">{currency}3,580.00</p>
          </div>
          <div>
            <p className="text-xs opacity-80">This Month's Expenses</p>
            <p className="text-lg font-semibold">{currency}2,149.25</p>
          </div>
        </div>
        <div className="flex gap-3 mb-5">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition text-white font-semibold shadow-md focus:outline-none">
            <Send className="h-4 w-4" />
            Pay
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition text-white font-semibold shadow-md focus:outline-none">
            <ArrowDown className="h-4 w-4" />
            Receive
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-1">
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
};

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-muted px-2 py-6">
      {/* User's Name at the Top */}
      <div className="font-semibold text-2xl mb-8 mt-3 text-finance-purple">
        {userName && (
          <span>
            Hi, <span className="font-extrabold">{userName}</span>
          </span>
        )}
      </div>

      {/* Main Balance Card */}
      <BalanceCard totalBalance={4931.17} currency="$" />

      {/* 
        All other dashboard widgets/layouts/icons would be rendered here, as before.
        If you had more widgets/components below, re-add them below this comment or here.
      */}
      {/* Example placeholder for other widgets: */}
      {/* <OtherDashboardWidgets /> */}
    </div>
  );
};

export default Dashboard;
