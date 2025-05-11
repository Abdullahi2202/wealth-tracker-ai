
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, CreditCard, PieChart } from "lucide-react";

const Dashboard = () => {
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    // Simulate loading balance
    setTimeout(() => {
      setTotalBalance(4931.17);
    }, 800);
  }, []);

  const quickStats = [
    {
      title: "Monthly Income",
      value: "$3,580.00",
      change: "+12%",
      icon: <ArrowUp className="h-4 w-4 text-finance-income" />,
      description: "vs last month",
    },
    {
      title: "Monthly Expenses",
      value: "$2,149.25",
      change: "-5%",
      icon: <ArrowDown className="h-4 w-4 text-finance-expense" />,
      description: "vs last month",
    },
    {
      title: "Active Cards",
      value: "2",
      icon: <CreditCard className="h-4 w-4 text-finance-blue" />,
      description: "Linked accounts",
    },
    {
      title: "Category Budget",
      value: "4/6",
      icon: <PieChart className="h-4 w-4 text-finance-purple" />,
      description: "Within limits",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <BalanceCard totalBalance={totalBalance} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:col-span-2">
            {quickStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.change && (
                      <span
                        className={
                          stat.change.startsWith("+")
                            ? "text-finance-income"
                            : "text-finance-expense"
                        }
                      >
                        {stat.change}{" "}
                      </span>
                    )}
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ExpenseChart />
          <RecentTransactions />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
