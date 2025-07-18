
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AddCard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topUpAmount = searchParams.get('amount');
  const returnTo = searchParams.get('returnTo');
  
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
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

  const detectCardBrand = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, '');
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6/.test(number)) return 'discover';
    return 'card';
  };

  const saveCardToDatabase = async (user: any) => {
    try {
      const cardNumber = cardData.cardNumber.replace(/\s/g, '');
      const brand = detectCardBrand(cardNumber);
      const last4 = cardNumber.slice(-4);
      const [expMonth, expYear] = cardData.expiryDate.split('/');

      console.log('AddCard: Saving card to database...');

      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          type: 'card',
          brand: brand,
          last4: last4,
          exp_month: parseInt(expMonth),
          exp_year: parseInt(`20${expYear}`),
          label: `${brand.charAt(0).toUpperCase() + brand.slice(1)} Card`,
          is_default: false,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('AddCard: Database save error:', error);
        throw error;
      }

      console.log('AddCard: Card saved successfully:', data);
      return data;

    } catch (error) {
      console.error('AddCard: Error saving card:', error);
      throw error;
    }
  };

  const handleProcessPayment = async () => {
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

    setLoading(true);

    try {
      console.log('AddCard: Starting payment process');

      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('AddCard: Session error:', sessionError);
        throw new Error('Authentication error. Please log in again.');
      }
      
      if (!session) {
        console.error('AddCard: No session found');
        throw new Error('Please log in to continue.');
      }

      console.log('AddCard: User authenticated, saving card...');

      // Save card to database first
      const savedCard = await saveCardToDatabase(session.user);

      if (topUpAmount) {
        console.log('AddCard: Processing top-up with saved card...');

        // Process top-up with the saved card
        const requestPayload = {
          amount: parseFloat(topUpAmount),
          payment_method_id: savedCard.id
        };

        console.log('AddCard: Request payload:', requestPayload);

        const { data, error } = await supabase.functions.invoke('create-topup-session', {
          body: JSON.stringify(requestPayload),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        console.log('AddCard: Function response:', { data, error });

        if (error) {
          console.error('AddCard: Function invocation error:', error);
          throw new Error(error.message || 'Failed to create payment session');
        }

        if (!data || !data.success) {
          console.error('AddCard: Server returned error:', data?.error);
          throw new Error(data?.error || 'Server error occurred');
        }

        if (!data.checkout_url) {
          console.error('AddCard: No checkout URL in response:', data);
          throw new Error('No checkout URL received');
        }

        console.log('AddCard: Redirecting to checkout:', data.checkout_url);
        
        toast.success(`Card saved! Redirecting to Stripe Checkout for $${topUpAmount}...`);
        
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        // Just saving the card, redirect back
        toast.success('Card saved successfully!');
        
        if (returnTo === 'topup') {
          navigate('/payments/topup');
        } else {
          navigate('/cards');
        }
      }

    } catch (error: any) {
      console.error("AddCard: Error:", error);
      setLoading(false);
      
      // Show user-friendly error messages
      if (error?.message) {
        if (error.message.includes('log in')) {
          toast.error(error.message, {
            action: {
              label: 'Login',
              onClick: () => window.location.href = '/login'
            }
          });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to process. Please try again.');
      }
    }
  };

  const getBackUrl = () => {
    if (returnTo === 'topup' && topUpAmount) {
      return '/payments/topup';
    }
    return '/payments/topup';
  };

  const getPageTitle = () => {
    if (topUpAmount) {
      return `Add $${topUpAmount} to Wallet`;
    }
    return 'Add Payment Method';
  };

  return (
    <div className="min-h-screen bg-muted pt-3 px-2">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(getBackUrl())}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-xl font-bold text-orange-600">
          {getPageTitle()}
        </h2>
      </div>
      
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {topUpAmount ? `Top Up $${topUpAmount}` : 'Add New Card'}
          </CardTitle>
          <CardDescription>
            {topUpAmount 
              ? `Enter your card details to add $${topUpAmount} to your wallet. Your card will be saved for future use.`
              : 'Enter your card details securely. All information is encrypted and protected.'
            }
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
              onClick={handleProcessPayment}
              className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Processing...' : (topUpAmount ? `Pay $${topUpAmount}` : 'Save Card')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(getBackUrl())}
              className="w-full h-12"
              disabled={loading}
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
