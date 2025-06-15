
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  date: string;
  type: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const categoryColors: Record<string, string> = {
  Food: '#f97316',
  Housing: '#06b6d4',
  Transport: '#8b5cf6',
  Entertainment: '#f59e0b',
  Shopping: '#ec4899',
  Healthcare: '#10b981',
  Education: '#6366f1',
  Utilities: '#84cc16',
  Salary: '#22c55e',
  Freelance: '#3b82f6',
  Investment: '#8b5cf6',
  Business: '#f59e0b',
  Misc: '#6b7280',
};

const TransactionCharts = () => {
  const [incomeData, setIncomeData] = useState<ChartData[]>([]);
  const [expenseData, setExpenseData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      let email = "";
      const storedUser = localStorage.getItem("walletmaster_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          email = userObj.email || "";
        } catch {}
      }
      
      if (!email) {
        setIncomeData([]);
        setExpenseData([]);
        setLoading(false);
        return;
      }

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("id, amount, category, type")
        .eq("email", email);

      if (!error && Array.isArray(transactions)) {
        // Process income data
        const incomeMap: Record<string, number> = {};
        const expenseMap: Record<string, number> = {};

        transactions.forEach((tx: Transaction) => {
          const category = tx.category && categoryColors[tx.category] ? tx.category : "Misc";
          const amount = Number(tx.amount);
          
          if (tx.type === "income") {
            incomeMap[category] = (incomeMap[category] || 0) + amount;
          } else if (tx.type === "expense") {
            expenseMap[category] = (expenseMap[category] || 0) + amount;
          }
        });

        const incomeChartData = Object.entries(incomeMap).map(([name, value]) => ({
          name,
          value,
          color: categoryColors[name] || "#6b7280",
        }));

        const expenseChartData = Object.entries(expenseMap).map(([name, value]) => ({
          name,
          value,
          color: categoryColors[name] || "#6b7280",
        }));

        setIncomeData(incomeChartData);
        setExpenseData(expenseChartData);
      } else {
        setIncomeData([]);
        setExpenseData([]);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const renderChart = (data: ChartData[], title: string) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No {title.toLowerCase()} found.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6">
      {renderChart(incomeData, "Income by Category")}
      {renderChart(expenseData, "Expenses by Category")}
    </div>
  );
};

export default TransactionCharts;
