
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

interface Transaction {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  date: string;
  type: string; // "income" or "expense"
}

interface CategorySummary {
  name: string;
  value: number;
  color: string;
}

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

      // First, get user_id from email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        setData([]);
        setLoading(false);
        console.error("Profile fetch error for expense chart:", profileError);
        return;
      }

      // Fetch user's expense transactions (not income) using user_id
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("id, amount, category, date, type")
        .eq("user_id", profile.id)
        .eq("type", "expense");
        
      if (!error && Array.isArray(txs)) {
        const catMap: Record<string, number> = {};
        txs.forEach((tx) => {
          const cat = tx.category && categoryColors[tx.category] ? tx.category : "Misc";
          catMap[cat] = (catMap[cat] || 0) + Number(tx.amount);
        });
        const finalData = Object.entries(catMap).map(([name, value]) => ({
          name,
          value,
          color: categoryColors[name] || "#6b7280",
        }));
        setData(finalData);
      } else {
        if (error) console.error("Transactions fetch error for expense chart:", error);
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
