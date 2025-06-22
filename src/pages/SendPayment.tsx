
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { Loader2 } from "lucide-react";

const CATEGORY_OPTIONS = [
  "Transfer", "Food", "Bills", "Shopping", "Transport", "Misc"
];

const SendPayment = () => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transfer");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { sendPayment, wallet, balance, refetch } = useWallet();
  const navigate = useNavigate();

  // Refresh wallet on component mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    
    if (!amountValue || amountValue <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    
    if (!recipient.trim()) {
      toast.error("Enter recipient phone number or email.");
      return;
    }

    if (balance < amountValue) {
      toast.error(`Insufficient wallet balance. Available: $${balance.toFixed(2)}`);
      return;
    }
    
    setLoading(true);

    try {
      console.log('Sending payment:', { recipient, amount: amountValue, note });
      
      const success = await sendPayment(recipient.trim(), amountValue, note);
      
      if (success) {
        toast.success(`Payment of $${amountValue.toFixed(2)} sent successfully!`);
        setAmount("");
        setRecipient("");
        setNote("");
        // Refresh wallet to show updated balance
        await refetch();
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
              <label className="block text-sm mb-1 font-medium">From Wallet</label>
              <div className="p-3 border rounded-md bg-gray-50">
                <div className="text-sm text-gray-600">Current Balance</div>
                <div className="text-lg font-semibold">${balance.toFixed(2)}</div>
                {wallet?.user_phone && (
                  <div className="text-xs text-gray-500">Phone: {wallet.user_phone}</div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm mb-1 font-medium">Recipient</label>
              <Input
                type="text"
                placeholder="Phone number or email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter phone number (e.g., +1234567890) or email address
              </p>
            </div>
            
            <div>
              <label className="block text-sm mb-1 font-medium">Amount ($)</label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                max={balance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1 font-medium">Category</label>
              <select
                className="w-full rounded-md p-2 border"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Note (Optional)</label>
              <Input
                type="text"
                value={note}
                placeholder="Optional note"
                onChange={(e) => setNote(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4 h-12" 
              disabled={loading || balance < parseFloat(amount || "0") || !recipient.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send $${amount || '0.00'}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendPayment;
