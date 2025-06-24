
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TopUpFormProps {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export const TopUpForm = ({ loading, onLoadingChange }: TopUpFormProps) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (!amount || amountValue < 1) {
      toast.error("Please enter a valid amount (minimum $1.00)");
      return;
    }

    onLoadingChange(true);

    try {
      console.log('Creating topup session for amount:', amountValue);

      const { data, error } = await supabase.functions.invoke('create-topup-session', {
        body: { amount: amountValue }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (!data?.success || !data?.checkout_url) {
        console.error('Invalid response:', data);
        throw new Error(data?.error || 'Invalid response from server');
      }

      console.log('Redirecting to Stripe Checkout:', data.checkout_url);
      
      toast.success(`Redirecting to payment for $${amountValue}...`);
      
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;

    } catch (error: any) {
      console.error("Payment error:", error);
      onLoadingChange(false);
      toast.error(error.message || 'Failed to process payment. Please try again.');
    }
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
            {loading ? 'Processing...' : `Pay $${amount || '0'} with Stripe`}
          </Button>
        </div>
      </form>
    </div>
  );
};
