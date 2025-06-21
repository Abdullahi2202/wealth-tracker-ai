
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CreditCard, Calendar, Lock } from "lucide-react";
import { CardTypeSelect, CardType } from "./CardTypeSelect";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

const STRIPE_PUBLISHABLE_KEY = "pk_test_51RXgVBRhotlUiiXdPUuoNpTNFEyH8HNLK9jFVg4lcrobEoNKtwH1QFUI4pWLCsMUFurVQEfrFxPahW8lDilmrp2j00iibXBiw8";

export function StripeCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardType, setCardType] = useState<CardType>("visa");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast.error("Stripe is not loaded");
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      toast.error("Card element not found");
      return;
    }

    setLoading(true);

    try {
      console.log('=== STARTING CARD ADDITION PROCESS ===');
      
      // Step 1: Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.email) {
        throw new Error('User not authenticated');
      }
      
      console.log('User authenticated:', user.email);

      // Step 2: Create Setup Intent via backend - ALWAYS fresh
      console.log('Creating fresh Setup Intent...');
      const { data: setupData, error: setupError } = await supabase.functions.invoke('create-setup-intent', {
        body: { email: user.email }
      });

      console.log('Raw setup response:', setupData);
      console.log('Setup error (if any):', setupError);

      if (setupError) {
        console.error('Setup Intent creation error:', setupError);
        throw new Error(`Failed to create Setup Intent: ${setupError.message}`);
      }

      if (!setupData?.client_secret) {
        console.error('Invalid setup data received:', setupData);
        throw new Error('No client secret received from server');
      }

      console.log('Setup Intent created successfully:', {
        setup_intent_id: setupData.setup_intent_id,
        has_client_secret: !!setupData.client_secret,
        client_secret_prefix: setupData.client_secret.substring(0, 15),
        full_client_secret: setupData.client_secret // DEBUG: Log full secret
      });

      // Validate client_secret format
      if (!setupData.client_secret.startsWith('seti_')) {
        throw new Error(`Invalid client_secret format: ${setupData.client_secret}`);
      }

      // Step 3: Confirm the Setup Intent with Stripe
      console.log('Confirming card setup with Stripe using client_secret:', setupData.client_secret);
      
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(
        setupData.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: label || `${cardType.toUpperCase()} Card`,
              email: user.email,
            },
          },
        }
      );

      console.log('Stripe confirmCardSetup result:', { setupIntent, confirmError });

      if (confirmError) {
        console.error('Card setup confirmation error:', confirmError);
        throw new Error(confirmError.message || 'Failed to confirm card setup');
      }

      if (!setupIntent || setupIntent.status !== 'succeeded') {
        throw new Error(`Card setup failed with status: ${setupIntent?.status || 'unknown'}`);
      }

      console.log('Card setup confirmed successfully with setupIntent:', setupIntent.id);

      // Step 4: Save the payment method to database
      console.log('Saving payment method to database...');
      const { data: saveResult, error: saveError } = await supabase.functions.invoke('add-stripe-card', {
        body: {
          email: user.email,
          label: label || `${cardType.toUpperCase()} Card`,
          setupIntentId: setupIntent.id,
        }
      });

      if (saveError) {
        console.error('Failed to save payment method:', saveError);
        throw new Error(`Failed to save card: ${saveError.message}`);
      }

      if (!saveResult?.success) {
        console.error('Save result error:', saveResult);
        throw new Error(saveResult?.error || 'Failed to save payment method');
      }

      console.log('=== CARD ADDITION COMPLETED SUCCESSFULLY ===');
      toast.success("Card added successfully!");
      onSuccess();

    } catch (error) {
      console.error('=== CARD ADDITION FAILED ===');
      console.error('Error details:', error);
      toast.error(error instanceof Error ? error.message : "Failed to add card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in font-sans text-[17px]">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 shadow-lg rounded-2xl px-6 py-8 md:py-10 space-y-6 flex flex-col"
        style={{
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
        }}
      >
        <h2 className="text-2xl font-bold text-finance-purple flex items-center gap-2 mb-1">
          <CreditCard className="text-finance-purple" size={28} />
          Add your card details
        </h2>
        <p className="text-gray-500 text-base mb-3">
          Enter your card information securely below.
        </p>
        
        <div>
          <CardTypeSelect value={cardType} onChange={setCardType} />
        </div>
        
        <div>
          <label htmlFor="card-label" className="block font-medium text-gray-700 mb-2">
            Card display name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <Input
            id="card-label"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="E.g. My Visa Card"
            className="mb-1"
          />
        </div>

        <div className="relative flex flex-col gap-2">
          <label htmlFor="card-number" className="block font-medium text-gray-700 mb-2">
            Card Number
          </label>
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/90 shadow-inner focus-within:ring-2 ring-finance-blue/40 px-3 py-3">
            <CreditCard className="text-finance-blue mr-2" size={20} />
            <CardNumberElement 
              id="card-number" 
              options={{
                style: { base: { fontSize: "18px", fontFamily: "inherit", color: "#2d2d2d" } }
              }} 
              className="flex-1 text-lg bg-gray-50 outline-none border-none"
            />
          </div>
        </div>

        <div className="relative flex flex-col gap-2">
          <label htmlFor="card-expiry" className="block font-medium text-gray-700 mb-2">
            Expiry Date <span className="text-gray-400 font-normal">(MM/YY)</span>
          </label>
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/90 shadow-inner focus-within:ring-2 ring-finance-blue/40 px-3 py-3">
            <Calendar className="text-finance-blue mr-2" size={20} />
            <CardExpiryElement 
              id="card-expiry" 
              options={{
                style: { base: { fontSize: "18px", fontFamily: "inherit", color: "#2d2d2d" } }
              }} 
              className="flex-1 text-lg bg-gray-50 outline-none border-none"
            />
          </div>
        </div>

        <div className="relative flex flex-col gap-2">
          <label htmlFor="card-cvc" className="block font-medium text-gray-700 mb-2 flex items-center gap-1">
            CVC (Security Code)
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Lock className="ml-1 text-gray-400 hover:text-finance-purple cursor-pointer" size={18} />
                </TooltipTrigger>
                <TooltipContent className="bg-white border shadow-md text-sm font-normal max-w-xs">
                  The 3-digit code on the back of your card
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/90 shadow-inner focus-within:ring-2 ring-finance-blue/40 px-3 py-3">
            <Lock className="text-finance-blue mr-2" size={20} />
            <CardCvcElement 
              id="card-cvc" 
              options={{
                style: { base: { fontSize: "18px", fontFamily: "inherit", color: "#2d2d2d" } }
              }} 
              className="flex-1 text-lg bg-gray-50 outline-none border-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11 font-semibold text-base border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 h-11 font-semibold text-base bg-finance-purple hover:bg-finance-indigo text-white shadow-md"
            disabled={loading || !stripe || !elements}
          >
            {loading ? "Adding Card..." : "Save Card"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function StripeCardFormWrapper(props: { onSuccess: () => void; onCancel: () => void }) {
  const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm {...props} />
    </Elements>
  );
}
