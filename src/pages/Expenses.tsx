
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import { PieChart } from "lucide-react";

const Expenses = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Expense Analysis</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseChart />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Housing", amount: 1200, percentage: 35, color: "#06b6d4" },
                { name: "Food", amount: 850, percentage: 25, color: "#f97316" },
                { name: "Shopping", amount: 420, percentage: 12, color: "#ec4899" },
                { name: "Transport", amount: 350, percentage: 10, color: "#8b5cf6" },
                { name: "Entertainment", amount: 280, percentage: 8, color: "#f59e0b" }
              ].map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                    <span>{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${category.amount}</p>
                    <p className="text-xs text-muted-foreground">{category.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
