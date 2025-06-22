
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentVerificationHandlerProps {
  onVerificationStart: () => void;
  onVerificationEnd: () => void;
  onRefetchWallet: () => Promise<void>;
}

export const PaymentVerificationHandler = ({
  onVerificationStart,
  onVerificationEnd,
  onRefetchWallet,
}: PaymentVerificationHandlerProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleUrlParams = async () => {
      try {
        console.log('PaymentVerificationHandler: Handling URL params...');
        const success = searchParams.get('success');
        const canceled = searchParams.get('canceled');
        const sessionId = searchParams.get('session_id');
        const topupAmount = searchParams.get('amount');

        console.log('PaymentVerificationHandler: URL params:', { success, canceled, sessionId, topupAmount });

        if (success === 'true' && sessionId) {
          console.log('PaymentVerificationHandler: Payment success detected');
          onVerificationStart();
          
          try {
            // Show immediate success message
            const displayAmount = topupAmount || 'wallet';
            toast.success(`Payment successful! Adding $${displayAmount} to your wallet...`);
            
            // Force multiple wallet refreshes to ensure balance is updated
            console.log('PaymentVerificationHandler: Force refreshing wallet balance...');
            await onRefetchWallet();
            
            // Additional refresh attempts with delays to ensure data consistency
            setTimeout(async () => {
              console.log('PaymentVerificationHandler: Additional wallet refresh (1s delay)');
              await onRefetchWallet();
            }, 1000);
            
            setTimeout(async () => {
              console.log('PaymentVerificationHandler: Final wallet refresh (2s delay)');
              await onRefetchWallet();
              toast.success(`Wallet updated! Added $${displayAmount} successfully.`);
            }, 2000);
            
            // Navigate back to dashboard after successful top-up
            setTimeout(() => {
              console.log('PaymentVerificationHandler: Navigating to dashboard');
              // Clean URL parameters before navigating
              window.history.replaceState({}, document.title, '/payments/topup');
              navigate('/dashboard', { replace: true });
            }, 3000);
            
          } catch (verificationError) {
            console.error('PaymentVerificationHandler: Payment verification exception:', verificationError);
            toast.error('Payment completed but wallet update failed. Please refresh the page.');
          }
          
          onVerificationEnd();
        } else if (canceled === 'true') {
          console.log('PaymentVerificationHandler: Payment canceled detected');
          toast.error('Payment was canceled');
          // Clean URL and stay on topup page
          window.history.replaceState({}, document.title, '/payments/topup');
          onVerificationEnd();
        } else {
          // No special URL params, just end verification
          console.log('PaymentVerificationHandler: No special URL params detected');
          onVerificationEnd();
        }
      } catch (error) {
        console.error('PaymentVerificationHandler: Error handling URL params:', error);
        toast.error('An error occurred processing the payment result');
        onVerificationEnd();
      }
    };

    handleUrlParams();
  }, [searchParams, navigate, onRefetchWallet, onVerificationStart, onVerificationEnd]);

  return null;
};
