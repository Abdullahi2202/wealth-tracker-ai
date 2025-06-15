
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TransactionData {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
}

const RecentTransactions = () => {
  const [transactionList, setTransactionList] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get user from localStorage (this matches app usage)
      const storedUser = localStorage.getItem("walletmaster_user");
      let email = "";
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          email = userObj.email || "";
        } catch {
          email = "";
        }
      }
      setLoading(true);
      if (!email) {
        setTransactionList([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("transactions")
        .select("id, name, category, amount, date, type")
        .eq("email", email)
        .order("date", { ascending: false })
        .limit(10);
      if (!error && Array.isArray(data)) {
        setTransactionList(data as TransactionData[]);
      } else {
        setTransactionList([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : transactionList.length === 0 ? (
            <div className="text-center text-muted-foreground">No transactions found.</div>
          ) : (
            transactionList.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      transaction.type === "income"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    )}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUp className="h-5 w-5" />
                    ) : (
                      <ArrowDown className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">{transaction.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-medium",
                      transaction.type === "income"
                        ? "text-finance-income"
                        : "text-finance-expense"
                    )}
                  >
                    {transaction.type === "income" ? "+" : "-"} ${transaction.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
