
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReceivedPayment {
  id: string;
  amount: number;
  date: string;
  name: string;
  note?: string;
  user_id?: string;
}

// Helper for short display
function shortLabel(desc: string, len = 12) {
  return desc.length > len ? desc.slice(0, len) + "…" : desc;
}

const ReceivedPaymentsMobile = () => {
  const navigate = useNavigate();
  const [received, setReceived] = useState<ReceivedPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceived = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setReceived([]);
          setLoading(false);
          return;
        }

        // Show payments where user is recipient (income transactions)
        const { data, error } = await supabase
          .from("transactions")
          .select("id, amount, date, name, note, user_id")
          .eq("user_id", user.id)
          .eq("type", "income")
          .order("date", { ascending: false })
          .limit(15);

        if (error) {
          console.error("Error fetching received payments:", error);
          setReceived([]);
        } else {
          setReceived(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
        setReceived([]);
      }
      setLoading(false);
    };
    fetchReceived();
  }, []);

  return (
    <div className="min-h-screen bg-muted pt-3 px-2 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          &larr; Payments
        </Button>
        <h2 className="text-xl font-bold text-green-600">Received Payments</h2>
      </div>
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl animate-scale-in">
        <CardHeader>
          <CardTitle>Received</CardTitle>
          <CardDescription>View your payment history.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {loading ? (
              <div className="text-center text-muted-foreground py-4">Loading…</div>
            ) : received.length === 0 ? (
              <p className="text-muted-foreground">No payments yet.</p>
            ) : (
              received.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold">
                      {pay.name || "Payment"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pay.note && shortLabel(pay.note)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="text-green-500" size={18} />
                    <span className="font-bold text-base">${Number(pay.amount).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceivedPaymentsMobile;
