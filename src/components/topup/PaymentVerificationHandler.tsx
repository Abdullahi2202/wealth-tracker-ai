
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
          console.log('PaymentVerificationHandler: Payment success detected, verifying payment:', { sessionId, topupAmount });
          onVerificationStart();
          
          try {
            console.log('PaymentVerificationHandler: Calling verify-payment function with session_id:', sessionId);
            
            const { data, error } = await supabase.functions.invoke('verify-payment', {
              body: { session_id: sessionId }
            });

            console.log('PaymentVerificationHandler: Verify payment response:', { data, error });

            if (error) {
              console.error('PaymentVerificationHandler: Payment verification error:', error);
              toast.error(`Payment verification failed: ${error.message || 'Unknown error'}`);
            } else if (data?.success && data?.wallet_updated) {
              console.log('PaymentVerificationHandler: Payment verified and wallet updated successfully:', data);
              const displayAmount = topupAmount || data.amount || 'your wallet';
              toast.success(`Successfully topped up $${displayAmount}! Wallet updated.`);
              
              // Force multiple wallet refreshes to ensure balance is updated
              console.log('PaymentVerificationHandler: Force refreshing wallet balance...');
              await onRefetchWallet();
              
              // Additional refresh attempts with delays
              setTimeout(async () => {
                console.log('PaymentVerificationHandler: Additional wallet refresh (500ms delay)');
                await onRefetchWallet();
              }, 500);
              
              setTimeout(async () => {
                console.log('PaymentVerificationHandler: Final wallet refresh (1.5s delay)');
                await onRefetchWallet();
              }, 1500);
              
              // Navigate back to dashboard after successful top-up
              setTimeout(() => {
                console.log('PaymentVerificationHandler: Navigating to dashboard');
                navigate('/dashboard', { replace: true });
              }, 2000);
            } else {
              console.error('PaymentVerificationHandler: Payment verification failed or wallet not updated:', data);
              toast.error('Payment verification failed. Please contact support if amount was charged.');
            }
          } catch (verificationError) {
            console.error('PaymentVerificationHandler: Payment verification exception:', verificationError);
            toast.error('Failed to verify payment. Please contact support if amount was charged.');
          }
          
          onVerificationEnd();
        } else if (canceled === 'true') {
          console.log('PaymentVerificationHandler: Payment canceled detected');
          toast.error('Payment was canceled');
          navigate('/payments/topup', { replace: true });
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
