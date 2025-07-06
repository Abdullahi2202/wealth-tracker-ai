
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, Phone, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

    if (balance < amountValue) {
      toast.error(`Insufficient wallet balance. Available: $${balance.toFixed(2)}`);
      return;
    }
    
    if (!recipient.trim() || !isValidPhoneNumber(recipient)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    
    setLoading(true);

    try {
      console.log('Processing user-to-user transfer:', { 
        recipient: recipient.trim(), 
        amount: amountValue, 
        note, 
        category
      });
      
      await sendPayment(
        recipient.trim(),
        amountValue,
        note
      );
      
      toast.success(`Transfer of $${amountValue.toFixed(2)} is pending admin approval. You will be notified once processed!`);
      
      // Reset form
      setAmount("");
      setRecipient("");
      setNote("");
      setCategory("Transfer");
      
      await refetch();
      
      setTimeout(() => {
        navigate("/transactions");
      }, 2000);
      
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Failed to process transfer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isValidPhoneNumber = (value: string) => {
    return /^\+?[\d\s-()]+$/.test(value) && !value.includes('@');
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

        {/* Admin Approval Notice */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All transactions require admin approval. Your transfer will be pending until reviewed and approved by an administrator.
          </AlertDescription>
        </Alert>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Money Transfer</CardTitle>
            <CardDescription>
              Send money to other users using their phone number
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
              {/* Recipient Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send To (Phone Number)
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="Phone number (e.g., 01121338969)"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                  <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the registered phone number of the recipient
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
                  !amount ||
                  !recipient.trim() || 
                  !isValidPhoneNumber(recipient)
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Send $${amount || '0.00'} (Pending Approval)`
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
