
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

      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('TopUpForm: Session error:', sessionError);
        throw new Error('Authentication error. Please log in again.');
      }
      
      if (!session) {
        console.error('TopUpForm: No session found');
        throw new Error('Please log in to continue.');
      }

      console.log('TopUpForm: User authenticated, creating checkout session...');

      // Create the request payload
      const requestPayload = {
        amount: amountValue
      };

      console.log('TopUpForm: Request payload:', requestPayload);

      // Use invoke method with proper payload and headers
      const { data, error } = await supabase.functions.invoke('create-topup-session', {
        body: requestPayload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('TopUpForm: Function response:', { data, error });

      if (error) {
        console.error('TopUpForm: Function invocation error:', error);
        
        // Handle specific error types
        if (error.message?.includes('AuthSessionMissingError')) {
          throw new Error('Session expired. Please log in again.');
        } else if (error.message?.includes('FunctionsHttpError')) {
          throw new Error('Payment service is temporarily unavailable. Please try again.');
        } else {
          throw new Error(error.message || 'Failed to create payment session');
        }
      }

      if (!data) {
        console.error('TopUpForm: No response data received');
        throw new Error('No response received from server');
      }

      if (!data.success) {
        console.error('TopUpForm: Server returned error:', data.error);
        throw new Error(data.error || 'Server error occurred');
      }

      if (!data.checkout_url) {
        console.error('TopUpForm: No checkout URL in response:', data);
        throw new Error('No checkout URL received');
      }

      console.log('TopUpForm: Redirecting to checkout:', data.checkout_url);
      
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;

    } catch (error: any) {
      console.error("TopUpForm: Top-up error:", error);
      onLoadingChange(false);
      
      // Show user-friendly error messages
      if (error?.message) {
        if (error.message.includes('log in')) {
          toast.error(error.message, {
            action: {
              label: 'Login',
              onClick: () => window.location.href = '/login'
            }
          });
        } else {
          toast.error(error.message);
        }
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
                Creating Payment Session...
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
