
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";

const TopUpWallet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { methods } = usePaymentMethods();
  const { wallet, refetch } = useWallet();

  // Check for success/cancel parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const topupAmount = searchParams.get('amount');

    if (success === 'true') {
      toast.success(`Successfully topped up $${topupAmount || 'your wallet'}!`);
      refetch(); // Refresh wallet balance
      // Clean up URL parameters
      navigate('/payments/topup', { replace: true });
    } else if (canceled === 'true') {
      toast.error('Top-up was canceled');
      // Clean up URL parameters
      navigate('/payments/topup', { replace: true });
    }
  }, [searchParams, navigate, refetch]);

  // Choose default payment method if available
  useEffect(() => {
    if (!method && methods.length > 0) {
      const cardMethod = methods.find(m => m.type === 'card');
      setMethod(cardMethod?.id || methods[0].id);
    }
  }, [methods, method]);

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
    
    setLoading(true);

    try {
      console.log('Starting top-up process...', { amount: amountValue, method, note });

      // Use supabase.functions.invoke instead of direct fetch
      const { data, error } = await supabase.functions.invoke('create-topup-session', {
        body: { 
          amount: amountValue,
          currency: 'usd'
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Top-up session error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (data?.checkout_url) {
        console.log('Redirecting to Stripe checkout:', data.checkout_url);
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        console.error('No checkout URL received:', data);
        throw new Error('No checkout URL received from payment processor');
      }
    } catch (error) {
      console.error("Top-up error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process top-up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted pt-3 px-2 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          &larr; Payments
        </Button>
        <h2 className="text-xl font-bold text-orange-600">Top-Up Wallet</h2>
      </div>
      
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl animate-scale-in">
        <CardHeader>
          <CardTitle>Top Up</CardTitle>
          <CardDescription>Add funds to your wallet.</CardDescription>
          {wallet && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Current Balance: <span className="font-semibold">
                  ${wallet.balance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTopUp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 font-medium">Amount ($)</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <PaymentMethodPicker 
              value={method} 
              onChange={setMethod} 
              label="Payment Method" 
              filterType="card" 
            />
            
            <div>
              <label className="block text-xs mb-1">Note (Optional)</label>
              <Input
                type="text"
                value={note}
                placeholder="Optional note"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full mt-3" disabled={loading}>
              {loading ? "Processing..." : `Top Up $${amount || '0.00'}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopUpWallet;
