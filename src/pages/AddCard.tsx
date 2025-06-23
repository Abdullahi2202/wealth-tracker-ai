
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";

const AddCard = () => {
  const navigate = useNavigate();
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cardNumber') {
      value = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value);
    } else if (field === 'cvv') {
      value = value.replace(/[^0-9]/g, '').substring(0, 4);
    }
    
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCard = () => {
    // Validate card data
    if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardholderName) {
      toast.error("Please fill in all card details");
      return;
    }

    if (cardData.cardNumber.replace(/\s/g, '').length < 16) {
      toast.error("Please enter a valid card number");
      return;
    }

    if (cardData.cvv.length < 3) {
      toast.error("Please enter a valid CVV");
      return;
    }

    // For demo purposes - in real implementation, this would securely save to Stripe
    toast.success("Card added successfully!");
    navigate("/payments");
  };

  return (
    <div className="min-h-screen bg-muted pt-3 px-2">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-xl font-bold text-orange-600">Add Payment Method</h2>
      </div>
      
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add New Card
          </CardTitle>
          <CardDescription>
            Enter your card details securely. All information is encrypted and protected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              placeholder="John Doe"
              value={cardData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              maxLength={19}
              className="h-12 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={cardData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                maxLength={5}
                className="h-12 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={cardData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                maxLength={4}
                className="h-12 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Lock className="h-4 w-4 text-green-600" />
            <p className="text-xs text-green-700">
              Your card information is secured with 256-bit SSL encryption
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleSaveCard}
              className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            >
              Save Card
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/payments")}
              className="w-full h-12"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCard;
