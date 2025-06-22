
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
            } else if (data?.success) {
              console.log('PaymentVerificationHandler: Payment verified successfully:', data);
              const displayAmount = topupAmount || data.amount || 'your wallet';
              toast.success(`Successfully topped up $${displayAmount}!`);
              
              // Refresh wallet balance with multiple attempts
              console.log('PaymentVerificationHandler: Refreshing wallet balance...');
              await onRefetchWallet();
              
              // Additional refresh attempts to ensure balance is updated
              setTimeout(async () => {
                console.log('PaymentVerificationHandler: Additional wallet refresh (1s delay)');
                await onRefetchWallet();
              }, 1000);
              
              setTimeout(async () => {
                console.log('PaymentVerificationHandler: Final wallet refresh (3s delay)');
                await onRefetchWallet();
              }, 3000);
            } else {
              console.error('PaymentVerificationHandler: Payment verification failed:', data);
              toast.error('Payment verification failed. Please contact support if amount was charged.');
            }
          } catch (verificationError) {
            console.error('PaymentVerificationHandler: Payment verification exception:', verificationError);
            toast.error('Failed to verify payment. Please contact support if amount was charged.');
          }
          
          // Clean up URL parameters and end verification
          console.log('PaymentVerificationHandler: Cleaning up URL parameters');
          navigate('/payments/topup', { replace: true });
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
