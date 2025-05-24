
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building, Wallet } from "lucide-react";

const receivedPayments = [
  {
    id: "p1",
    sender: "John Doe",
    amount: 120.8,
    date: "2025-05-26",
    description: "Lunch split",
    source: "bank",
  },
  {
    id: "p2",
    sender: "Alice Smith",
    amount: 85.0,
    date: "2025-05-24",
    description: "Project refund",
    source: "wallet",
  },
];

const ReceivedPaymentsMobile = () => {
  const navigate = useNavigate();

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
            {receivedPayments.length === 0 ? (
              <p className="text-muted-foreground">No payments yet.</p>
            ) : (
              receivedPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold">{pay.sender}</div>
                    <div className="text-xs text-muted-foreground">
                      {pay.description} • {new Date(pay.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pay.source === "bank" ? (
                      <Building className="text-blue-500" size={18} />
                    ) : (
                      <Wallet className="text-green-500" size={18} />
                    )}
                    <span className="font-bold text-base">${pay.amount.toFixed(2)}</span>
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
