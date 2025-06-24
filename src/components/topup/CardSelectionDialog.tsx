import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Plus } from "lucide-react";
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
  const { methods, refetch } = usePaymentMethods();

  const handleExistingCardTopup = async (paymentMethodId: string) => {
    setLoading(true);
    try {
      const amountValue = parseFloat(topUpAmount);
      if (!amountValue || amountValue < 1) {
        throw new Error("Invalid amount");
      }

      const { data, error } = await supabase.functions.invoke('create-topup-session', {
        body: { 
          amount: amountValue,
          payment_method_id: paymentMethodId 
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;

    } catch (error: any) {
      console.error("Payment error:", error);
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
              Add a new payment method to use for your topup.
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
            Select a payment method or add a new one for your ${topUpAmount} topup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Existing Cards */}
          {methods.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Your Cards</h4>
              {methods.map((method) => (
                <Card key={method.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getCardIcon(method.brand)}
                        <div>
                          <p className="font-medium">
                            {method.label || `${method.brand} Card`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            •••• •••• •••• {method.last4}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleExistingCardTopup(method.id)}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Use This Card'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add New Card Option */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Add New Card</h4>
            <Button
              variant="outline"
              className="w-full h-12 border-dashed"
              onClick={() => setShowAddCard(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Card & Pay ${topUpAmount}
            </Button>
          </div>

          {/* Direct Payment Option */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Pay Directly</h4>
            <Button
              className="w-full h-12"
              onClick={() => handleExistingCardTopup('')}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay $${topUpAmount} with Stripe`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
