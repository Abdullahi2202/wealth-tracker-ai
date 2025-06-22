
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, Phone, Mail, ArrowLeft } from "lucide-react";

const CATEGORY_OPTIONS = [
  "Transfer", "Food", "Bills", "Shopping", "Transport", "Entertainment", "Utilities", "Other"
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
      console.log('Sending payment:', { recipient, amount: amountValue, note, category });
      
      const success = await sendPayment(recipient.trim(), amountValue, note);
      
      if (success) {
        toast.success(`Payment of $${amountValue.toFixed(2)} sent successfully!`);
        
        // Reset form
        setAmount("");
        setRecipient("");
        setNote("");
        setCategory("Transfer");
        
        // Refresh wallet to show updated balance
        await refetch();
        
        // Navigate back after short delay
        setTimeout(() => {
          navigate("/payments");
        }, 2000);
      } else {
        toast.error("Failed to send payment. Please try again.");
      }
    } catch (error) {
      console.error("Send payment error:", error);
      toast.error("Failed to send payment. Please try again.");
    }
    
    setLoading(false);
  };

  const isValidRecipient = (value: string) => {
    return value.includes('@') || /^\+?[\d\s-()]+$/.test(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-4 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/payments")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Send Payment
            </CardTitle>
            <CardDescription>
              Transfer money from your wallet to another user
            </CardDescription>
            
            {/* Wallet Balance Display */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Available Balance</span>
                <span className="text-lg font-bold text-blue-900">
                  ${balance.toFixed(2)}
                </span>
              </div>
              {wallet?.user_phone && (
                <div className="text-xs text-gray-600 mt-1">
                  Wallet: {wallet.user_phone}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSend} className="space-y-6">
              {/* Recipient Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send To
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Phone number or email address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {recipient.includes('@') ? (
                      <Mail className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Phone className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter phone number (e.g., +1234567890) or email address
                </p>
              </div>
              
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
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
                  className="text-lg"
                />
                {amount && parseFloat(amount) > balance && (
                  <p className="text-xs text-red-500 mt-1">
                    Amount exceeds available balance
                  </p>
                )}
              </div>
              
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Note Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <Input
                  type="text"
                  value={note}
                  placeholder="What's this payment for?"
                  onChange={(e) => setNote(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Send Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700" 
                disabled={
                  loading || 
                  balance < parseFloat(amount || "0") || 
                  !recipient.trim() || 
                  !isValidRecipient(recipient) ||
                  !amount
                }
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
    </div>
  );
};

export default SendPayment;
