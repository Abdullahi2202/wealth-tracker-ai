
// This file now computes real user spending breakdowns by category!

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
      // Fetch user's expense transactions (not income)
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("id, amount, category, date, type")
        .eq("email", email)
        .eq("type", "expense");
      if (!error && Array.isArray(txs)) {
        // Aggregate by category
        const catMap: Record<string, number> = {};
        let total = 0;
        txs.forEach((tx: Transaction) => {
          const cat = tx.category && categoryColors[tx.category] ? tx.category : "Misc";
          catMap[cat] = (catMap[cat] || 0) + Number(tx.amount);
          total += Number(tx.amount);
        });
        const finalData = Object.entries(catMap).map(([name, value]) => ({
          name,
          value,
          color: categoryColors[name] || "#6b7280",
        }));
        setData(finalData);
      } else {
        setData([]);
      }
      setLoading(false);
    };

    fetchExpenses();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Monthly Expenses</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[300px]">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center text-muted-foreground">No expenses found.</div>
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
};

export default ExpenseChart;
