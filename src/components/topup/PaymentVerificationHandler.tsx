
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

        console.log('Payment result:', { success, canceled, sessionId, amount });

        if (success === 'true' && sessionId) {
          console.log('Payment successful, updating wallet...');
          onVerificationStart();
          
          // Show immediate success message
          toast.success(`Payment successful! Adding $${amount || 'amount'} to your wallet...`);
          
          // Force wallet refresh with multiple attempts
          console.log('Refreshing wallet balance...');
          await onRefetchWallet();
          
          // Additional refresh attempts with delays
          setTimeout(async () => {
            console.log('Additional wallet refresh attempt 1');
            await onRefetchWallet();
          }, 1000);
          
          setTimeout(async () => {
            console.log('Additional wallet refresh attempt 2');
            await onRefetchWallet();
            toast.success(`Wallet updated! $${amount || 'amount'} added successfully.`);
          }, 2000);
          
          // Clean URL and navigate to dashboard
          setTimeout(() => {
            window.history.replaceState({}, document.title, '/payments/topup');
            navigate('/dashboard', { replace: true });
          }, 3000);
          
        } else if (canceled === 'true') {
          console.log('Payment was canceled');
          toast.error('Payment was canceled');
          window.history.replaceState({}, document.title, '/payments/topup');
        }
        
        onVerificationEnd();
      } catch (error) {
        console.error('Error handling payment result:', error);
        toast.error('Error processing payment result');
        onVerificationEnd();
      }
    };

    // Only run if we have URL parameters
    if (searchParams.has('success') || searchParams.has('canceled')) {
      handlePaymentResult();
    } else {
      onVerificationEnd();
    }
  }, [searchParams, navigate, onRefetchWallet, onVerificationStart, onVerificationEnd]);

  return null;
};
