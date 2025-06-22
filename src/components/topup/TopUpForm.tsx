
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface TopUpFormProps {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export const TopUpForm = ({ loading, onLoadingChange }: TopUpFormProps) => {
  const [amount, setAmount] = useState("");

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0) {
      toast.error("Enter a valid amount (minimum $1.00).");
      return;
    }

    if (amountValue < 1) {
      toast.error("Minimum top-up amount is $1.00");
      return;
    }
    
    onLoadingChange(true);

    try {
      console.log('TopUpForm: Starting top-up process for amount:', amountValue);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Please log in to continue.');
      }

      console.log('TopUpForm: Creating checkout session...');

      // Prepare request body
      const requestBody = { 
        amount: amountValue,
        currency: 'usd'
      };

      console.log('TopUpForm: Request body:', requestBody);

      const { data, error } = await supabase.functions.invoke('create-topup-session', {
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('TopUpForm: Checkout response:', { data, error });

      if (error) {
        console.error('TopUpForm: Checkout creation error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (!data || !data.checkout_url) {
        console.error('TopUpForm: Invalid response data:', data);
        throw new Error('No checkout URL received');
      }

      console.log('TopUpForm: Redirecting to checkout:', data.checkout_url);
      
      // Redirect immediately without showing processing message
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error("TopUpForm: Top-up error:", error);
      onLoadingChange(false);
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to process top-up. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleTopUp} className="space-y-4">
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
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Add $${amount || '0.00'} to Wallet`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
