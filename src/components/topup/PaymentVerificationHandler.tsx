
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

        console.log('PaymentVerificationHandler: Checking URL params:', { 
          success, 
          canceled, 
          sessionId, 
          amount,
          fullUrl: window.location.href 
        });

        // Only process if we have payment-related parameters
        if (!success && !canceled) {
          console.log('PaymentVerificationHandler: No payment parameters found, skipping');
          onVerificationEnd();
          return;
        }

        if (success === 'true' && sessionId) {
          console.log('PaymentVerificationHandler: Processing successful payment...');
          onVerificationStart();
          
          // Show immediate success message
          toast.success(`Payment successful! Processing $${amount || 'amount'}...`);
          
          try {
            console.log('PaymentVerificationHandler: Getting user session...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('PaymentVerificationHandler: Session error:', sessionError);
              throw new Error('Authentication error. Please log in again.');
            }
            
            if (!session) {
              console.error('PaymentVerificationHandler: No session found');
              throw new Error('Please log in to continue.');
            }

            console.log('PaymentVerificationHandler: Verifying payment with backend...');
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-payment', {
              body: { session_id: sessionId },
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              }
            });

            console.log('PaymentVerificationHandler: Verification result:', { verificationData, verificationError });

            if (verificationError) {
              console.error('PaymentVerificationHandler: Verification error:', verificationError);
              toast.error('Payment verification failed. Please contact support if money was charged.');
            } else if (verificationData?.success) {
              console.log('PaymentVerificationHandler: Payment verified successfully');
              toast.success(`Wallet updated! $${amount || verificationData.amount} added successfully.`);
              
              // Refresh wallet balance multiple times
              console.log('PaymentVerificationHandler: Refreshing wallet balance...');
              await onRefetchWallet();
              
              // Additional refresh attempts with delays to ensure update
              setTimeout(async () => {
                console.log('PaymentVerificationHandler: Second wallet refresh...');
                await onRefetchWallet();
              }, 2000);
              
              setTimeout(async () => {
                console.log('PaymentVerificationHandler: Third wallet refresh...');
                await onRefetchWallet();
              }, 5000);
            } else {
              console.error('PaymentVerificationHandler: Verification failed:', verificationData);
              toast.error('Payment verification failed. Please check your wallet balance or contact support.');
            }
          } catch (error) {
            console.error('PaymentVerificationHandler: Error during verification:', error);
            toast.error('Error verifying payment. Please check your wallet balance.');
          }
          
          // Clean URL and redirect after processing
          setTimeout(() => {
            console.log('PaymentVerificationHandler: Cleaning URL and redirecting...');
            window.history.replaceState({}, document.title, '/payments/topup');
            navigate('/dashboard', { replace: true });
          }, 8000);
          
        } else if (canceled === 'true') {
          console.log('PaymentVerificationHandler: Payment was canceled');
          toast.error('Payment was canceled');
          // Clean URL immediately for canceled payments
          window.history.replaceState({}, document.title, '/payments/topup');
        } else {
          console.log('PaymentVerificationHandler: Invalid payment parameters');
          toast.error('Invalid payment response received');
          // Clean URL for invalid parameters
          window.history.replaceState({}, document.title, '/payments/topup');
        }
        
      } catch (error) {
        console.error('PaymentVerificationHandler: Error in handlePaymentResult:', error);
        toast.error('Error processing payment result');
      } finally {
        onVerificationEnd();
      }
    };

    handlePaymentResult();
  }, [searchParams, navigate, onRefetchWallet, onVerificationStart, onVerificationEnd]);

  return null;
};
