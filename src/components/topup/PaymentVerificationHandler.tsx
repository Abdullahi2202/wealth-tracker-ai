
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

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
          console.log('Payment successful - processing wallet update...');
          onVerificationStart();
          
          // Show immediate success message
          toast.success(`Payment successful! Adding $${amount || 'amount'} to your wallet...`);
          
          // Multiple wallet refresh attempts to ensure balance updates
          console.log('Refreshing wallet balance...');
          await onRefetchWallet();
          
          // Additional refresh with delays to handle any propagation delays
          const refreshAttempts = [2000, 5000, 8000];
          
          refreshAttempts.forEach((delay, index) => {
            setTimeout(async () => {
              console.log(`Wallet refresh attempt ${index + 2}`);
              await onRefetchWallet();
              
              // Show final success message on last attempt
              if (index === refreshAttempts.length - 1) {
                toast.success(`Wallet updated! $${amount || 'amount'} added successfully.`);
              }
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
