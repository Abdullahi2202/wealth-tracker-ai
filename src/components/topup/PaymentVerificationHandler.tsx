
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
              
              // Refresh wallet balance immediately and with retries
              await onRefetchWallet();
              setTimeout(() => onRefetchWallet(), 1000);
              setTimeout(() => onRefetchWallet(), 3000);
            } else {
              console.error('PaymentVerificationHandler: Payment verification failed:', data);
              toast.error('Payment verification failed. Please contact support if amount was charged.');
            }
          } catch (verificationError) {
            console.error('PaymentVerificationHandler: Payment verification exception:', verificationError);
            toast.error('Failed to verify payment. Please contact support if amount was charged.');
          } finally {
            onVerificationEnd();
          }
          
          // Clean up URL parameters
          navigate('/payments/topup', { replace: true });
        } else if (canceled === 'true') {
          console.log('PaymentVerificationHandler: Payment canceled detected');
          toast.error('Payment was canceled');
          // Clean up URL parameters
          navigate('/payments/topup', { replace: true });
        }
      } catch (error) {
        console.error('PaymentVerificationHandler: Error handling URL params:', error);
        toast.error('An error occurred processing the payment result');
      } finally {
        console.log('PaymentVerificationHandler: Finished handling URL params');
        onVerificationEnd();
      }
    };

    // Add a small delay to ensure the component is mounted
    const timer = setTimeout(() => {
      handleUrlParams();
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams, navigate, onRefetchWallet, onVerificationStart, onVerificationEnd]);

  return null;
};
