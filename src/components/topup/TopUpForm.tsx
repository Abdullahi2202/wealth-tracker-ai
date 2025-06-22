
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface TopUpFormProps {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export const TopUpForm = ({ loading, onLoadingChange }: TopUpFormProps) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    if (!method) {
      toast.error("Please select a payment method.");
      return;
    }
    
    onLoadingChange(true);

    try {
      console.log('TopUpForm: === STARTING TOP-UP PROCESS ===');
      console.log('TopUpForm: Amount:', amountValue);

      // Get current session to ensure we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('TopUpForm: Session error:', sessionError);
        throw new Error('Authentication error. Please log in again.');
      }

      if (!session) {
        console.error('TopUpForm: No session found');
        throw new Error('Please log in to continue.');
      }

      console.log('TopUpForm: User authenticated, calling create-topup-session...');

      // Call the create-topup-session function
      const { data, error } = await supabase.functions.invoke('create-topup-session', {
        body: { 
          amount: amountValue,
          currency: 'usd'
        }
      });

      console.log('TopUpForm: Function response:', { data, error });

      if (error) {
        console.error('TopUpForm: Function invocation error:', error);
        let errorMessage = 'Failed to create payment session';
        if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (!data || !data.checkout_url) {
        console.error('TopUpForm: No checkout URL in response:', data);
        throw new Error('No checkout URL received from payment processor');
      }

      console.log('TopUpForm: Redirecting to Stripe checkout:', data.checkout_url);
      
      // Show loading message and redirect
      toast.info("Redirecting to Stripe checkout...");
      
      // Small delay to ensure the toast is visible
      setTimeout(() => {
        window.location.href = data.checkout_url;
      }, 500);

    } catch (error) {
      console.error("TopUpForm: === TOP-UP ERROR ===");
      console.error("TopUpForm: Error details:", error);
      
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
        <label className="block text-sm mb-1 font-medium">Amount ($)</label>
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
      
      <PaymentMethodPicker 
        value={method} 
        onChange={setMethod} 
        label="Payment Method" 
        filterType="card"
        disabled={loading}
      />
      
      <div>
        <label className="block text-xs mb-1">Note (Optional)</label>
        <Input
          type="text"
          value={note}
          placeholder="Optional note for this top-up"
          onChange={(e) => setNote(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full h-12 text-lg font-semibold" 
          disabled={loading || !amount || parseFloat(amount) <= 0}
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
        <div className="text-center text-sm text-gray-600 mt-3 p-3 bg-yellow-50 rounded-lg border">
          <p className="font-medium">Processing your request...</p>
          <p>You will be redirected to Stripe to complete the payment securely.</p>
          <p className="text-xs mt-1">Please do not close this window.</p>
        </div>
      )}
    </form>
  );
};
