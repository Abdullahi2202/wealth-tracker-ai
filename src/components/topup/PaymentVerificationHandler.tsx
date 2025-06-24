
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
    const handlePaymentResult = async () => {
      try {
        const success = searchParams.get('success');
        const cancelled = searchParams.get('cancelled');
        const sessionId = searchParams.get('session_id');

        console.log('Payment result:', { success, cancelled, sessionId });

        if (!success && !cancelled) {
          onVerificationEnd();
          return;
        }

        if (success === 'true' && sessionId) {
          console.log('Processing successful payment...');
          onVerificationStart();
          
          toast.success('Payment successful! Updating your wallet...');
          
          try {
            const { data, error } = await supabase.functions.invoke('verify-topup-payment', {
              body: { session_id: sessionId }
            });

            if (error || !data?.success) {
              console.error('Verification error:', error || data);
              toast.error('Payment verification failed. Please contact support if money was charged.');
            } else {
              console.log('Payment verified successfully');
              toast.success('Wallet updated successfully!');
              
              // Refresh wallet balance
              await onRefetchWallet();
              
              // Additional refresh after delay
              setTimeout(async () => {
                await onRefetchWallet();
              }, 2000);
            }
          } catch (error) {
            console.error('Error during verification:', error);
            toast.error('Error verifying payment. Please check your wallet balance.');
          }
          
          // Clean URL and redirect
          setTimeout(() => {
            window.history.replaceState({}, document.title, '/payments/topup');
            navigate('/dashboard', { replace: true });
          }, 3000);
          
        } else if (cancelled === 'true') {
          console.log('Payment was cancelled');
          toast.error('Payment was cancelled');
          window.history.replaceState({}, document.title, '/payments/topup');
        }
        
      } catch (error) {
        console.error('Error in payment result handler:', error);
        toast.error('Error processing payment result');
      } finally {
        onVerificationEnd();
      }
    };

    handlePaymentResult();
  }, [searchParams, navigate, onRefetchWallet, onVerificationStart, onVerificationEnd]);

  return null;
};
