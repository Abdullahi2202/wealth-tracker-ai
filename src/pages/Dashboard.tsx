
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, QrCode, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [totalBalance, setTotalBalance] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading balance
    setTimeout(() => {
      setTotalBalance(4931.17);
    }, 800);
  }, []);

  const actionButtons = [
    {
      title: "Top Up",
      icon: <ArrowUp className="h-6 w-6 text-finance-income" />,
      action: () => navigate("/payments?tab=request"),
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Transfer",
      icon: <ArrowDown className="h-6 w-6 text-finance-expense" />,
      action: () => navigate("/payments"),
      color: "bg-red-50 text-red-600",
    },
    {
      title: "QR Code",
      icon: <QrCode className="h-6 w-6 text-finance-blue" />,
      action: () => navigate("/payments?mode=qr"),
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Wallet",
      icon: <Wallet className="h-6 w-6 text-finance-purple" />,
      action: () => navigate("/cards"),
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <BalanceCard totalBalance={totalBalance} />
          </div>
          
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {actionButtons.map((button, index) => (
                  <button
                    key={index}
                    onClick={button.action}
                    className="flex flex-col items-center justify-center p-4 rounded-lg transition-all hover:scale-105"
                  >
                    <div className={`p-3 rounded-full mb-2 ${button.color}`}>
                      {button.icon}
                    </div>
                    <span className="text-sm font-medium">{button.title}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <ExpenseChart />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
