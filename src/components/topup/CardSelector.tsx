
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

interface CardSelectorProps {
  selectedCardId: string;
  onCardSelect: (cardId: string) => void;
  topUpAmount: string;
  onProceedWithCard: () => void;
  loading: boolean;
}

export const CardSelector = ({ 
  topUpAmount, 
  onProceedWithCard,
  loading 
}: CardSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Ready to Pay</h3>
        <p className="text-gray-600">You'll be redirected to Stripe to complete your payment</p>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg text-center">
        <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
        <p className="text-lg font-semibold text-blue-800">
          Amount: ${topUpAmount}
        </p>
      </div>

      <Button 
        onClick={onProceedWithCard}
        className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Processing...' : `Pay $${topUpAmount} with Stripe`}
      </Button>
    </div>
  );
};
