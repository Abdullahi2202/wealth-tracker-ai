import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  category: string | null;
}

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      setLoading(true);
      let user = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData?.session?.user;
      } catch {}
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      // Remove users join if present, use just transactions
      const { data, error } = await supabase
        .from("transactions")
        .select("id, name, amount, type, status, created_at, category")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && Array.isArray(data)) {
        setTransactions(data);
      } else {
        setTransactions([]);
      }
      setLoading(false);
    };

    fetchRecentTransactions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="text-center py-4">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-4">No recent transactions</div>
        ) : (
          <ul className="space-y-3">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="border-b pb-3 last:border-none">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{transaction.name}</span>
                      {transaction.category && (
                        <Badge variant="secondary" className="ml-2">{transaction.category}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-medium text-right">
                    {transaction.type === 'credit' ? '+' : '-'}
                    ${transaction.amount.toFixed(2)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
