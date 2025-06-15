
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useWallet } from "@/hooks/useWallet";

const CATEGORY_OPTIONS = [
  "Transfer", "Food", "Bills", "Shopping", "Transport", "Misc"
];

const TAG_OPTIONS = [
  "friends", "family", "business", "refund", "split"
];

const SendPayment = () => {
  const [fromMethod, setFromMethod] = useState<string>("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transfer");
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { methods } = usePaymentMethods();
  const { sendPayment, wallet, balance } = useWallet();
  const navigate = useNavigate();

  // Set default method when available
  useEffect(() => {
    if (!fromMethod && methods.length > 0) setFromMethod(methods[0].id);
  }, [methods, fromMethod]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    
    if (!amountValue || amountValue <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    
    if (!recipient) {
      toast.error("Enter recipient email or ID.");
      return;
    }

    if (balance < amountValue) {
      toast.error("Insufficient wallet balance.");
      return;
    }
    
    setLoading(true);

    try {
      const success = await sendPayment(recipient, amountValue, note);
      
      if (success) {
        toast.success(`Payment of $${amountValue.toFixed(2)} sent to ${recipient}!`);
        setAmount("");
        setRecipient("");
        setNote("");
        setTag("");
      } else {
        toast.error("Failed to send payment. Please try again.");
      }
    } catch (error) {
      console.error("Send payment error:", error);
      toast.error("Failed to send payment. Please try again.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted pt-3 px-2 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          &larr; Payments
        </Button>
        <h2 className="text-xl font-bold text-finance-blue">Send Payment</h2>
      </div>
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl animate-scale-in">
        <CardHeader>
          <CardTitle>Send Money</CardTitle>
          <CardDescription>
            Transfer money from your wallet. Available balance: ${balance.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm mb-1">From Wallet</label>
              <div className="p-3 border rounded-md bg-gray-50">
                <div className="text-sm text-gray-600">Current Balance</div>
                <div className="text-lg font-semibold">${balance.toFixed(2)}</div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Recipient Email</label>
              <Input
                type="email"
                placeholder="Enter recipient email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Amount</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                max={balance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs">Category</label>
                <select
                  className="w-full rounded-md p-2 border"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs">Tag</label>
                <select
                  className="w-full rounded-md p-2 border"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                >
                  <option value="">(None)</option>
                  {TAG_OPTIONS.map((tagOpt) => <option key={tagOpt} value={tagOpt}>{tagOpt}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs">Note</label>
              <Input
                type="text"
                value={note}
                placeholder="Optional note"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4" 
              disabled={loading || balance < parseFloat(amount || "0")}
            >
              {loading ? "Sending..." : "Send Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendPayment;
