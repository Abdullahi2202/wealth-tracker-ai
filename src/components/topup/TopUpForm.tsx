
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

      const { data, error } = await supabase.functions.invoke('create-topup-session', {
        body: { 
          amount: amountValue,
          currency: 'usd'
        },
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
        throw new Error('No checkout URL received');
      }

      console.log('TopUpForm: Redirecting to checkout:', data.checkout_url);
      
      toast.success("Redirecting to payment...");
      
      // Immediate redirect to avoid white pages
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
    <form onSubmit={handleTopUp} className="space-y-4">
      <div>
        <label className="block text-sm mb-2 font-medium">Top-up Amount ($)</label>
        <Input
          type="number"
          placeholder="10.00"
          min="1.00"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={loading}
          className="text-lg"
        />
        <p className="text-xs text-gray-500 mt-1">
          Minimum amount: $1.00
        </p>
      </div>
      
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full h-12 text-lg font-semibold" 
          disabled={loading || !amount || parseFloat(amount) < 1}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Top Up $${amount || '0.00'}`
          )}
        </Button>
      </div>

      {loading && (
        <div className="text-center text-sm text-gray-600 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-medium text-blue-800">Processing your payment...</p>
          <p className="text-blue-700">Redirecting to secure payment page...</p>
        </div>
      )}
    </form>
  );
};
