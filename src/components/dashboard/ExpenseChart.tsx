
import { PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const categoryColors: Record<string, string> = {
  Food: '#f97316',
  Housing: '#06b6d4',
  Transport: '#8b5cf6',
  Entertainment: '#f59e0b',
  Shopping: '#ec4899',
  Misc: '#6b7280',
};

type CategorySummary = {
  name: string;
  value: number;
  color: string;
};

const ExpenseChart = () => {
  const [data, setData] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
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
        setData([]);
        setLoading(false);
        return;
      }

      try {
        // Get user profile - break down the query to avoid deep type inference
        const profileQuery = supabase.from('profiles').select('id').eq('email', email);
        const profileResponse = await profileQuery.single();
        
        if (profileResponse.error || !profileResponse.data) {
          setData([]);
          setLoading(false);
          console.error("Profile fetch error for expense chart:", profileResponse.error);
          return;
        }

        const userId = profileResponse.data.id;

        // Fetch transactions - simplified query structure
        const transactionQuery = supabase
          .from("transactions")
          .select("id, amount, category, type")
          .eq("user_id", userId)
          .eq("type", "expense");
        
        const transactionResponse = await transactionQuery;
        
        if (transactionResponse.error) {
          console.error("Transactions fetch error for expense chart:", transactionResponse.error);
          setData([]);
          setLoading(false);
          return;
        }

        const transactions = transactionResponse.data || [];
        const categoryTotals: Record<string, number> = {};
        
        // Process transactions
        for (const tx of transactions) {
          const category = (tx.category && categoryColors[tx.category]) ? tx.category : "Misc";
          const amount = Number(tx.amount) || 0;
          categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        }
        
        // Convert to chart data
        const chartData: CategorySummary[] = Object.entries(categoryTotals).map(([name, value]) => ({
          name,
          value,
          color: categoryColors[name] || "#6b7280",
        }));
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching expenses:", error);
        setData([]);
      }
      
      setLoading(false);
    };

    fetchExpenses();
  }, []);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm">{`${payload[0].name}: $${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Monthly Expenses</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[300px]">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">No expenses found.</div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PieChart width={300} height={300}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={70}
                  strokeWidth={2}
                  label={({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <CustomTooltip />
              </PieChart>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;
