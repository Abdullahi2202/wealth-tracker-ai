
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardSelectionDialog } from "./CardSelectionDialog";

interface TopUpFormProps {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export const TopUpForm = ({ loading, onLoadingChange }: TopUpFormProps) => {
  const [amount, setAmount] = useState("");
  const [showCardDialog, setShowCardDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (!amount || amountValue < 1) {
      return;
    }

    setShowCardDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowCardDialog(false);
    setAmount("");
    onLoadingChange(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-700">
            Top-up Amount ($)
          </label>
          <Input
            type="number"
            placeholder="Enter amount (e.g., 50.00)"
            min="1.00"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={loading}
            className="text-lg h-12"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum amount: $1.00 • Powered by Stripe
          </p>
        </div>
        
        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700" 
            disabled={loading || !amount || parseFloat(amount) < 1}
          >
            Continue to Payment
          </Button>
        </div>
      </form>

      <CardSelectionDialog
        open={showCardDialog}
        onOpenChange={setShowCardDialog}
        topUpAmount={amount}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
