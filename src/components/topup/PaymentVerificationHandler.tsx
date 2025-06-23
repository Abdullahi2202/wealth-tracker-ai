
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
        const canceled = searchParams.get('canceled');
        const sessionId = searchParams.get('session_id');
        const amount = searchParams.get('amount');

        console.log('Payment verification:', { success, canceled, sessionId, amount });

        if (success === 'true' && sessionId) {
          console.log('Payment successful - verifying and updating wallet...');
          onVerificationStart();
          
          // Show immediate success message
          toast.success(`Payment successful! Adding $${amount || 'amount'} to your wallet...`);
          
          // Verify payment with backend
          try {
            console.log('Verifying payment with backend...');
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-payment', {
              body: { session_id: sessionId }
            });

            console.log('Payment verification result:', { verificationData, verificationError });

            if (verificationError || !verificationData?.success) {
              console.error('Payment verification failed:', verificationError || verificationData?.error);
              toast.error('Payment verification failed. Please contact support.');
            } else {
              console.log('Payment verified successfully');
              toast.success(`Wallet updated! $${amount || 'amount'} added successfully.`);
            }
          } catch (error) {
            console.error('Error during payment verification:', error);
            toast.error('Error verifying payment. Please check your wallet balance.');
          }
          
          // Refresh wallet balance multiple times to ensure it updates
          console.log('Refreshing wallet balance...');
          await onRefetchWallet();
          
          // Additional refresh attempts with delays
          const refreshAttempts = [2000, 5000, 8000];
          
          refreshAttempts.forEach((delay, index) => {
            setTimeout(async () => {
              console.log(`Wallet refresh attempt ${index + 2}`);
              await onRefetchWallet();
            }, delay);
          });
          
          // Clean URL and navigate back to dashboard
          setTimeout(() => {
            window.history.replaceState({}, document.title, '/payments/topup');
            navigate('/dashboard', { replace: true });
          }, 10000);
          
        } else if (canceled === 'true') {
          console.log('Payment was canceled by user');
          toast.error('Payment was canceled');
          window.history.replaceState({}, document.title, '/payments/topup');
        } else if (searchParams.has('success') || searchParams.has('canceled')) {
          // Invalid parameters
          console.log('Invalid payment parameters received');
          toast.error('Invalid payment response received');
          window.history.replaceState({}, document.title, '/payments/topup');
        }
        
        onVerificationEnd();
      } catch (error) {
        console.error('Error handling payment result:', error);
        toast.error('Error processing payment result');
        onVerificationEnd();
      }
    };

    // Only process if we have relevant URL parameters
    if (searchParams.has('success') || searchParams.has('canceled')) {
      handlePaymentResult();
    } else {
      onVerificationEnd();
    }
  }, [searchParams, navigate, onRefetchWallet, onVerificationStart, onVerificationEnd]);

  return null;
};
