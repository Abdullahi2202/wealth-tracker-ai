
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
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const TopUpWallet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const { methods } = usePaymentMethods();
  const { wallet, refetch } = useWallet();

  // Handle success/cancel URL parameters
  useEffect(() => {
    const handleUrlParams = async () => {
      const success = searchParams.get('success');
      const canceled = searchParams.get('canceled');
      const sessionId = searchParams.get('session_id');
      const topupAmount = searchParams.get('amount');

      if (success === 'true' && sessionId) {
        console.log('Payment success detected, verifying payment:', { sessionId, topupAmount });
        setVerifyingPayment(true);
        
        try {
          // Verify payment with backend
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { session_id: sessionId }
          });

          if (error) {
            console.error('Payment verification error:', error);
            toast.error(
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Payment verification failed</span>
              </div>
            );
          } else if (data.success) {
            console.log('Payment verified successfully:', data);
            toast.success(
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Successfully topped up ${topupAmount || 'your wallet'}!</span>
              </div>
            );
            
            // Refresh wallet balance multiple times to ensure it's updated
            setTimeout(() => refetch(), 1000);
            setTimeout(() => refetch(), 3000);
            setTimeout(() => refetch(), 5000);
          } else {
            console.error('Payment verification failed:', data);
            toast.error(
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Payment verification failed</span>
              </div>
            );
          }
        } catch (error) {
          console.error('Payment verification exception:', error);
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Failed to verify payment</span>
            </div>
          );
        } finally {
          setVerifyingPayment(false);
        }
        
        // Clean up URL parameters
        navigate('/payments/topup', { replace: true });
      } else if (canceled === 'true') {
        console.log('Payment canceled detected');
        toast.error(
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Payment was canceled</span>
          </div>
        );
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

  // Auto-refresh wallet balance periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

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
        
        // Show more specific error message
        let errorMessage = 'Failed to create payment session';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        throw new Error(errorMessage);
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
        toast.error(
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>{error.message}</span>
          </div>
        );
      } else {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>Failed to process top-up. Please try again.</span>
          </div>
        );
      }
    }
  };

  if (initializing || verifyingPayment) {
    return (
      <div className="min-h-screen bg-muted pt-3 px-2 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-600">
            {verifyingPayment ? 'Verifying payment...' : 'Loading top-up page...'}
          </p>
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-700">
                  Current Balance: <span className="font-semibold">
                    ${wallet.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refetch}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </Button>
              </div>
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
