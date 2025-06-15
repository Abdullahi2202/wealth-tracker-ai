
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useWallet } from "@/hooks/useWallet";

const TopUpWallet = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { methods } = usePaymentMethods();
  const { addFunds, refetch } = useWallet();

  // Choose default payment method if available
  useEffect(() => {
    if (!method && methods.length > 0) setMethod(methods[0].id);
  }, [methods, method]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    
    setLoading(true);
    const amountValue = parseFloat(amount);

    try {
      const success = await addFunds(amountValue, method, note || "Wallet Top-Up");
      
      if (success) {
        toast.success(`$${amountValue.toFixed(2)} added to your wallet.`);
        setAmount("");
        setNote("");
        await refetch(); // Refresh wallet balance
      } else {
        toast.error("Failed to add funds. Please try again.");
      }
    } catch (error) {
      console.error("Top-up error:", error);
      toast.error("Failed to add funds. Please try again.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted pt-3 px-2 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          &larr; Payments
        </Button>
        <h2 className="text-xl font-bold text-orange-600">Top-Up Wallet</h2>
      </div>
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl animate-scale-in">
        <CardHeader>
          <CardTitle>Top Up</CardTitle>
          <CardDescription>Add funds to your wallet.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTopUp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <PaymentMethodPicker 
              value={method} 
              onChange={setMethod} 
              label="Payment Method" 
              filterType="all" 
            />
            
            <div>
              <label className="block text-xs">Note (Optional)</label>
              <Input
                type="text"
                value={note}
                placeholder="Optional note"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full mt-3" disabled={loading}>
              {loading ? "Processing..." : "Top Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopUpWallet;
