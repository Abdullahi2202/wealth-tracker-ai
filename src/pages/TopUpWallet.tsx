
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useWallet } from "@/hooks/useWallet";
import { Loader2 } from "lucide-react";
import { PaymentVerificationHandler } from "@/components/topup/PaymentVerificationHandler";
import { WalletBalanceDisplay } from "@/components/topup/WalletBalanceDisplay";
import { TopUpForm } from "@/components/topup/TopUpForm";
import { LoadingScreen } from "@/components/topup/LoadingScreen";

const TopUpWallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const { methods } = usePaymentMethods();
  const { wallet, refetch } = useWallet();

  // Auto-refresh wallet balance periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const handleVerificationStart = () => {
    setVerifyingPayment(true);
  };

  const handleVerificationEnd = () => {
    setVerifyingPayment(false);
    setInitializing(false);
  };

  // Show loading screen while initializing or verifying payment
  if (initializing || verifyingPayment) {
    return (
      <LoadingScreen 
        message={verifyingPayment ? 'Verifying payment...' : 'Loading top-up page...'} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted pt-3 px-2 animate-fade-in">
      <PaymentVerificationHandler
        onVerificationStart={handleVerificationStart}
        onVerificationEnd={handleVerificationEnd}
        onRefetchWallet={refetch}
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
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>Add funds to your wallet securely via Stripe.</CardDescription>
          <WalletBalanceDisplay wallet={wallet} onRefresh={refetch} />
        </CardHeader>
        <CardContent>
          <TopUpForm loading={loading} onLoadingChange={setLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TopUpWallet;
