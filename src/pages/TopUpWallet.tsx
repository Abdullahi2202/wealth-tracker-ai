
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
import { Loader2 } from "lucide-react";

const TopUpWallet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const { methods } = usePaymentMethods();
  const { wallet, refetch } = useWallet();

  // Check for success/cancel parameters on component mount
  useEffect(() => {
    const handleUrlParams = async () => {
      const success = searchParams.get('success');
      const canceled = searchParams.get('canceled');
      const topupAmount = searchParams.get('amount');
      const sessionId = searchParams.get('session_id');

      if (success === 'true') {
        console.log('Top-up success detected:', { topupAmount, sessionId });
        toast.success(`Successfully topped up $${topupAmount || 'your wallet'}!`);
        
        // Refresh wallet balance multiple times to ensure it's updated
        setTimeout(() => refetch(), 1000);
        setTimeout(() => refetch(), 3000);
        setTimeout(() => refetch(), 5000);
        
        // Clean up URL parameters
        navigate('/payments/topup', { replace: true });
      } else if (canceled === 'true') {
        console.log('Top-up canceled detected');
        toast.error('Top-up was canceled');
        // Clean up URL parameters
        navigate('/payments/topup', { replace: true });
      }

      setInitializing(false);
    };

    handleUrlParams();
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
      console.log('=== STARTING TOP-UP PROCESS ===');
      console.log('Amount:', amountValue);

      // Get current session to ensure we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication error. Please log in again.');
      }

      if (!session) {
        console.error('No session found');
        throw new Error('Please log in to continue.');
      }

      console.log('User authenticated, calling create-topup-session...');

      // Call the create-topup-session function
      const { data, error } = await supabase.functions.invoke('create-topup-session', {
        body: { 
          amount: amountValue,
          currency: 'usd'
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (!data || !data.checkout_url) {
        console.error('No checkout URL in response:', data);
        throw new Error('No checkout URL received from payment processor');
      }

      console.log('Redirecting to Stripe checkout:', data.checkout_url);
      
      // Show loading state with message
      toast.info("Redirecting to Stripe checkout...");
      
      // Use window.location.href for better compatibility
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error("=== TOP-UP ERROR ===");
      console.error("Error details:", error);
      
      setLoading(false);
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to process top-up. Please try again.");
      }
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-muted pt-3 px-2 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-600">Loading top-up page...</p>
        </div>
      </div>
    );
  }

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
          <CardTitle className="flex items-center gap-2">
            Top Up Your Wallet
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>Add funds to your wallet securely via Stripe.</CardDescription>
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
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopUpWallet;
