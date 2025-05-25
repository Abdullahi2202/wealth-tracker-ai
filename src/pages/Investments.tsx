
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Helper to format currency
const formatMoney = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

interface Investment {
  id: string;
  name: string;
  value: number;
  change_pct: number | null;
  is_positive: boolean | null;
  created_at: string;
}

const Investments = () => {
  // Investments and loading state
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Chart sample – demo: portfolio value over 7 months (replace with actual if you track monthly history someday)
  const [chartData, setChartData] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    const fetchInvestments = async () => {
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
        setInvestments([]);
        setChartData([]);
        setLoading(false);
        return;
      }
      // Fetch investments
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        setInvestments(data);
        // Prepare portfolio performance chart points (synthetic, last 7 entries as "months")
        setChartData(
          data
            .slice(0, 7)
            .reverse()
            .map((inv, idx) => ({
              name: `M${idx + 1}`,
              amount: inv.value,
            }))
        );
      } else {
        setInvestments([]);
        setChartData([]);
      }
      setLoading(false);
    };
    fetchInvestments();
  }, []);

  // Compute summary
  const totalValue = investments.reduce((s, i) => s + Number(i.value || 0), 0);
  const totalReturn = investments.reduce(
    (s, i) =>
      s + (i.value * ((i.change_pct ?? 0) / 100)),
    0
  );
  const totalReturnPct =
    investments.length > 0
      ? (
          (investments.reduce((s, i) => s + Number(i.change_pct ?? 0), 0) /
            investments.length) || 0
        ).toFixed(1)
      : "0";

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Investment Insights</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatMoney(Number(value)), "Value"]} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Total Value</p>
                  <p className="text-2xl font-bold">{formatMoney(totalValue)}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Total Return</p>
                  <p className="text-2xl font-bold text-finance-income">
                    {totalReturn >= 0 ? "+" : ""}
                    {formatMoney(totalReturn)} ({totalReturnPct}%)
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Your Investments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : investments.length === 0 ? (
              <div className="text-center text-muted-foreground">No investments found.</div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {investments.map((investment, idx) => (
                  <div 
                    key={investment.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${investment.is_positive ? 'bg-green-100' : 'bg-red-100'}`}>
                        {investment.is_positive ? (
                          <TrendingUp className="h-4 w-4 text-finance-income" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-finance-expense" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{investment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {investment.change_pct !== null
                            ? `${investment.change_pct > 0 ? "+" : ""}${investment.change_pct}%`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatMoney(Number(investment.value))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6">
              <Button className="w-full" variant="outline" disabled>
                {/* Future: Add Investment */}
                View All Investments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Investments;
