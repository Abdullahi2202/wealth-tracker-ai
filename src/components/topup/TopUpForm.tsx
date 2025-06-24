
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardSelector } from "./CardSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TopUpFormProps {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export const TopUpForm = ({ loading, onLoadingChange }: TopUpFormProps) => {
  const [amount, setAmount] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [showCardSelector, setShowCardSelector] = useState(false);

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amountValue < 1) {
      toast.error("Minimum top-up amount is $1.00");
      return;
    }
    
    setShowCardSelector(true);
  };

  const handleProceedWithCard = async () => {
    if (!selectedCardId) {
      toast.error("Please select a payment method");
      return;
    }

    const amountValue = parseFloat(amount);
    onLoadingChange(true);

    try {
      console.log('TopUpForm: Starting payment with selected card:', selectedCardId);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('TopUpForm: Session error:', sessionError);
        throw new Error('Authentication error. Please log in again.');
      }
      
      if (!session) {
        console.error('TopUpForm: No session found');
        throw new Error('Please log in to continue.');
      }

      console.log('TopUpForm: Creating checkout session...');

      const requestPayload = {
        amount: amountValue,
        payment_method_id: selectedCardId
      };

      console.log('TopUpForm: Request payload:', requestPayload);

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
        throw new Error(error.message || 'Failed to create payment session');
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
      
      toast.success(`Redirecting to Stripe Checkout for $${amountValue}...`);
      
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;

    } catch (error: any) {
      console.error("TopUpForm: Payment error:", error);
      onLoadingChange(false);
      
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
        toast.error('Failed to process payment. Please try again.');
      }
    }
  };

  const handleBackToAmount = () => {
    setShowCardSelector(false);
    setSelectedCardId("");
  };

  if (showCardSelector) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBackToAmount}>
            ← Back to Amount
          </Button>
          <div className="text-right">
            <p className="text-sm text-gray-600">Top-up Amount</p>
            <p className="text-lg font-semibold">${amount}</p>
          </div>
        </div>

        <CardSelector
          selectedCardId={selectedCardId}
          onCardSelect={setSelectedCardId}
          topUpAmount={amount}
          onProceedWithCard={handleProceedWithCard}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleInitialSubmit} className="space-y-4">
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
            Continue to Payment Method
          </Button>
        </div>
      </form>
    </div>
  );
};
