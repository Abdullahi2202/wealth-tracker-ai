
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ExpenseChart from "@/components/dashboard/ExpenseChart";

const Dashboard = () => {
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    // Simulate loading balance
    setTimeout(() => {
      setTotalBalance(4931.17);
    }, 800);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <BalanceCard totalBalance={totalBalance} />
          </div>
          
          <div className="md:col-span-2">
            <ExpenseChart />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
