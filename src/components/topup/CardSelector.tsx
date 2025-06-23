
import { useState } from "react";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, CreditCard, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CardSelectorProps {
  selectedCardId: string;
  onCardSelect: (cardId: string) => void;
  topUpAmount: string;
  onProceedWithCard: () => void;
  loading: boolean;
}

export const CardSelector = ({ 
  selectedCardId, 
  onCardSelect, 
  topUpAmount, 
  onProceedWithCard,
  loading 
}: CardSelectorProps) => {
  const navigate = useNavigate();
  const { methods, loading: methodsLoading, refetch } = usePaymentMethods();

  const formatCardDisplay = (method: any) => {
    const brandName = method.brand ? 
      method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : 'Card';
    return `${brandName} •••• ${method.last4}`;
  };

  const getCardIcon = () => <CreditCard className="h-5 w-5" />;

  if (methodsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose Payment Method</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refetch}
          disabled={methodsLoading}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {methods.length > 0 ? (
        <div className="space-y-4">
          <RadioGroup value={selectedCardId} onValueChange={onCardSelect}>
            {methods.map((method) => (
              <div key={method.id} className="flex items-center space-x-3">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label 
                  htmlFor={method.id} 
                  className="flex-1 cursor-pointer"
                >
                  <Card className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getCardIcon()}
                          <div>
                            <p className="font-medium">{formatCardDisplay(method)}</p>
                            {method.exp_month && method.exp_year && (
                              <p className="text-sm text-gray-500">
                                Expires {String(method.exp_month).padStart(2, '0')}/{String(method.exp_year).slice(-2)}
                              </p>
                            )}
                          </div>
                        </div>
                        {method.is_default && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={onProceedWithCard}
              className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
              disabled={!selectedCardId || loading}
            >
              {loading ? 'Processing...' : `Pay $${topUpAmount} with Selected Card`}
            </Button>
          </div>
        </div>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Payment Methods</h3>
            <p className="text-gray-600 mb-4">
              Add a payment method to continue with your top-up.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="border-t pt-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/payments/add-card?amount=${topUpAmount}&returnTo=topup`)}
          className="w-full h-12 flex items-center justify-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Payment Method</span>
        </Button>
      </div>
    </div>
  );
};
