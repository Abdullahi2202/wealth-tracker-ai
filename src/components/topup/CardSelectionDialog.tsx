
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Plus, Loader2 } from "lucide-react";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import StripeCardFormWrapper from "@/components/payments/StripeCardForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CardSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topUpAmount: string;
  onSuccess: () => void;
}

export const CardSelectionDialog = ({ 
  open, 
  onOpenChange, 
  topUpAmount, 
  onSuccess 
}: CardSelectionDialogProps) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);
  const { methods, refetch } = usePaymentMethods();

  const handleExistingCardTopup = async (paymentMethodId: string) => {
    setLoading(true);
    setProcessingCardId(paymentMethodId);
    
    try {
      const amountValue = parseFloat(topUpAmount);
      if (!amountValue || amountValue < 1) {
        throw new Error("Invalid amount");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No valid session found");
      }

      const topupDetails = {
        amount: amountValue,
        payment_method_id: paymentMethodId 
      };

      console.log("Processing direct payment with existing card:", topupDetails);

      const response = await fetch('https://cbhtifqmlkdoevxmbjmm.supabase.co/functions/v1/create-topup-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiaHRpZnFtbGtkb2V2eG1iam1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTY3MjYsImV4cCI6MjA2Mjg3MjcyNn0.USk2Wi_HbcfFni8TTyZMqAjdbGC3eVIvqZvWm5dq_i8',
        },
        body: JSON.stringify(topupDetails),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error(`HTTP error! status: ${response.status}`, errorBody);
        throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Payment response:", data);

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to process payment');
      }

      // Handle direct payment success
      if (data.direct_payment) {
        if (data.status === 'succeeded') {
          toast.success('Payment successful! Your wallet has been updated.');
          onOpenChange(false);
          onSuccess();
        } else {
          toast.error('Payment failed. Please try again.');
        }
      } else if (data.checkout_url) {
        // Fallback to checkout session
        onOpenChange(false);
        const newWindow = window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          toast.error('Please allow popups to complete payment');
          return;
        }
        toast.success('Redirecting to Stripe checkout...');
        onSuccess();
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
      setProcessingCardId(null);
    }
  };

  const handleDirectPayment = async () => {
    setLoading(true);
    try {
      const amountValue = parseFloat(topUpAmount);
      if (!amountValue || amountValue < 1) {
        throw new Error("Invalid amount");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No valid session found");
      }

      const topupDetails = {
        amount: amountValue
      };

      console.log("Sending direct payment request:", topupDetails);

      const response = await fetch('https://cbhtifqmlkdoevxmbjmm.supabase.co/functions/v1/create-topup-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiaHRpZnFtbGtkb2V2eG1iam1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTY3MjYsImV4cCI6MjA2Mjg3MjcyNn0.USk2Wi_HbcfFni8TTyZMqAjdbGC3eVIvqZvWm5dq_i8',
        },
        body: JSON.stringify(topupDetails),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error(`HTTP error! status: ${response.status}`, errorBody);
        throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Direct payment session created:", data);

      if (!data?.success || !data?.checkout_url) {
        throw new Error(data?.error || 'Failed to create payment session');
      }

      onOpenChange(false);
      
      const newWindow = window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        toast.error('Please allow popups to complete payment');
        return;
      }

      toast.success('Redirecting to Stripe checkout...');
      onSuccess();

    } catch (error: any) {
      console.error("Direct payment error:", error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCardSuccess = () => {
    refetch();
    setShowAddCard(false);
    toast.success("Card added successfully! You can now use it for topup.");
  };

  const getCardIcon = (brand?: string) => {
    return <CreditCard className="h-5 w-5" />;
  };

  if (showAddCard) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
            <DialogDescription>
              Add a new payment method for your ${topUpAmount} topup.
            </DialogDescription>
          </DialogHeader>
          <StripeCardFormWrapper
            onSuccess={handleNewCardSuccess}
            onCancel={() => setShowAddCard(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            Select how you'd like to pay for your ${topUpAmount} topup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Existing Cards */}
          {methods.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Your Saved Cards</h4>
              {methods.map((method) => (
                <Card key={method.id} className="cursor-pointer hover:bg-gray-50 border-2 hover:border-blue-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getCardIcon(method.brand)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {method.label || `${method.brand} Card`}
                          </p>
                          <p className="text-sm text-gray-500">
                            •••• •••• •••• {method.last4}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleExistingCardTopup(method.id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 min-w-[80px]"
                      >
                        {processingCardId === method.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Pay Now'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>
            </div>
          )}

          {/* New Payment Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              {methods.length > 0 ? 'Other Payment Options' : 'Payment Options'}
            </h4>
            
            {/* Add New Card and Pay */}
            <Card className="cursor-pointer hover:bg-gray-50 border-2 hover:border-green-200 transition-colors">
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-0 justify-start text-left"
                  onClick={() => setShowAddCard(true)}
                  disabled={loading}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Plus className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Add New Card & Save</p>
                      <p className="text-sm text-gray-500">
                        Save a new card to your wallet for future use
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Direct Payment */}
            <Card className="cursor-pointer hover:bg-gray-50 border-2 hover:border-purple-200 transition-colors">
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-0 justify-start text-left"
                  onClick={handleDirectPayment}
                  disabled={loading}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Pay with New Card</p>
                      <p className="text-sm text-gray-500">
                        Pay ${topUpAmount} without saving card details
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
