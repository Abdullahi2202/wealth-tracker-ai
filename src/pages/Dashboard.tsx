import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import BalanceCard from "@/components/dashboard/BalanceCard";

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
