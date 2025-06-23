
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, AlertCircle } from "lucide-react";
import { PaymentVerificationHandler } from "@/components/topup/PaymentVerificationHandler";
import { WalletBalanceDisplay } from "@/components/topup/WalletBalanceDisplay";
import { TopUpForm } from "@/components/topup/TopUpForm";
import { LoadingScreen } from "@/components/topup/LoadingScreen";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TopUpWallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const { methods } = usePaymentMethods();
  const { wallet, loading: walletLoading, error: walletError, refetch } = useWallet();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('TopUpWallet: Auth check result:', { session: !!session, error });
        
        if (error) {
          console.error('TopUpWallet: Auth error:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error('TopUpWallet: Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('TopUpWallet: Auth state changed:', { event, session: !!session });
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh wallet balance more frequently during topup process
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      console.log('TopUpWallet: Auto-refreshing wallet balance...');
      refetch();
    }, 5000); // Refresh every 5 seconds for faster updates

    return () => clearInterval(interval);
  }, [refetch, isAuthenticated]);

  // Initialize the page
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    
    const initializePage = async () => {
      try {
        console.log('TopUpWallet: Initializing page...');
        // Initial wallet fetch
        await refetch();
        console.log('TopUpWallet: Page initialization complete');
      } catch (error) {
        console.error('TopUpWallet: Error during initialization:', error);
        toast.error('Failed to initialize wallet data');
      } finally {
        // Reduce initialization time to show page faster
        setTimeout(() => {
          setInitializing(false);
        }, 500);
      }
    };

    initializePage();
  }, [refetch, isAuthenticated, authLoading]);

  const handleVerificationStart = () => {
    console.log('TopUpWallet: Payment verification started');
    setVerifyingPayment(true);
  };

  const handleVerificationEnd = () => {
    console.log('TopUpWallet: Payment verification ended');
    setVerifyingPayment(false);
  };

  const handleRefetchWallet = async () => {
    console.log('TopUpWallet: Manual wallet refetch triggered');
    try {
      await refetch();
      console.log('TopUpWallet: Wallet refetch completed successfully');
    } catch (error) {
      console.error('TopUpWallet: Error during wallet refetch:', error);
      toast.error('Failed to refresh wallet data');
    }
    return Promise.resolve();
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted pt-3 px-2">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
            &larr; Payments
          </Button>
          <h2 className="text-xl font-bold text-orange-600">Top-Up Wallet</h2>
        </div>
        
        <Card className="max-w-md mx-auto shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to be logged in to access your wallet and top-up funds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please log in to continue with topping up your wallet balance.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleLoginRedirect} className="flex-1">
                  Go to Login
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading screen during payment verification
  if (verifyingPayment) {
    return (
      <LoadingScreen 
        message="Processing payment and updating wallet..." 
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted pt-3 px-2 animate-fade-in">
      <PaymentVerificationHandler
        onVerificationStart={handleVerificationStart}
        onVerificationEnd={handleVerificationEnd}
        onRefetchWallet={handleRefetchWallet}
      />
      
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
            {(loading || initializing || walletLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>Add funds to your wallet securely via Stripe.</CardDescription>
          
          {/* Show wallet error if any */}
          {walletError && (
            <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{walletError}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefetchWallet}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                Retry
              </Button>
            </div>
          )}
          
          <WalletBalanceDisplay wallet={wallet} onRefresh={handleRefetchWallet} />
        </CardHeader>
        <CardContent>
          <TopUpForm loading={loading} onLoadingChange={setLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TopUpWallet;
