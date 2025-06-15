
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TransactionItem {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  date: string | null;
  type: string;
}

const RecentTransactions = () => {
  const [transactionList, setTransactionList] = useState<TransactionItem[]>([]);
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
      
      try {
        // First get the user_id from the users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();

        if (userError || !userData) {
          setTransactionList([]);
          setLoading(false);
          return;
        }

        // Then get transactions using user_id
        const { data: transactionData, error: transactionError } = await supabase
          .from("transactions")
          .select("id, name, category, amount, date, type")
          .eq("user_id", userData.id)
          .order("date", { ascending: false })
          .limit(10);
        
        if (!transactionError && transactionData) {
          // Map the data with explicit typing
          const mappedData: TransactionItem[] = transactionData.map((item) => ({
            id: String(item.id),
            name: String(item.name),
            category: item.category ? String(item.category) : null,
            amount: Number(item.amount),
            date: item.date ? String(item.date) : null,
            type: String(item.type)
          }));
          
          setTransactionList(mappedData);
        } else {
          setTransactionList([]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
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
                      {transaction.category || "Uncategorized"}
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
                    {transaction.date ? new Date(transaction.date).toLocaleDateString() : "No date"}
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
