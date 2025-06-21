
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

// Use the test publishable key that matches your test secret key
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RXgVBRhotlUiiXdPUuoNpTNFEyH8HNLK9jFVg4lcrobEoNKtwH1QFUI4pWLCsMUFurVQEfrFxPahW8lDilmrp2j00iibXBiw8";

export function StripeCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardType, setCardType] = useState<CardType>("visa");

  // Get logged in user's email from Supabase auth
  const getAuthenticatedUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) {
      throw new Error('User not authenticated or email not available');
    }
    return user;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error("Stripe is not loaded. Please check your Stripe configuration.");
      return;
    }

    setLoading(true);

    const numberElement = elements.getElement(CardNumberElement);
    if (!numberElement) {
      toast.error("Card form not loaded.");
      setLoading(false);
      return;
    }

    try {
      console.log('Starting card addition process...');
      
      // Get authenticated user
      const user = await getAuthenticatedUser();
      console.log('User authenticated:', user.email);
      
      // 1. Create SetupIntent using Supabase edge function
      console.log('Creating setup intent...');
      const { data: setupData, error: setupError } = await supabase.functions.invoke('create-setup-intent', {
        body: { email: user.email }
      });

      if (setupError) {
        console.error('Setup intent creation failed:', setupError);
        throw new Error(`Failed to create setup intent: ${setupError.message}`);
      }

      if (!setupData?.client_secret || !setupData?.setup_intent_id) {
        console.error('Invalid setup intent response:', setupData);
        throw new Error('Invalid response from setup intent creation');
      }

      const { client_secret, setup_intent_id, customer_id } = setupData;
      console.log('Setup intent created:', { setup_intent_id, customer_id });

      // 2. Confirm the SetupIntent with Stripe.js
      console.log('Confirming card setup...');
      const { error, setupIntent } = await stripe.confirmCardSetup(client_secret, {
        payment_method: {
          card: numberElement,
          billing_details: { 
            email: user.email 
          }
        }
      });

      if (error) {
        console.error('Card setup error:', error);
        toast.error(error.message || "Card setup failed");
        setLoading(false);
        return;
      }

      if (setupIntent.status !== 'succeeded') {
        console.error('Setup intent not succeeded:', setupIntent.status);
        toast.error("Card setup was not completed successfully");
        setLoading(false);
        return;
      }

      console.log('Card setup confirmed:', setupIntent.id);
      
      // Add delay before calling backend to ensure setup intent is available
      console.log('Waiting before saving card...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      
      // 3. Save the payment method to our database using Supabase edge function
      console.log('Saving card to database...');
      const { data: saveData, error: saveError } = await supabase.functions.invoke('add-stripe-card', {
        body: {
          email: user.email,
          label: label || `${cardType.toUpperCase()} Card`,
          setupIntentId: setupIntent.id,
        }
      });
      
      if (saveError) {
        console.error('Save failed:', saveError);
        toast.error(saveError.message || "Failed to save card");
      } else if (!saveData?.success) {
        console.error('Save failed:', saveData);
        toast.error(saveData?.error || "Failed to save card");
      } else {
        console.log('Card saved successfully:', saveData);
        toast.success(saveData.message || "Card added successfully!");
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add card. Please try again.");
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
        aria-label="Credit Card Information"
      >
        <h2 className="text-2xl font-bold text-finance-purple flex items-center gap-2 mb-1">
          <CreditCard className="text-finance-purple" size={28} />
          Add your card details
        </h2>
        <p className="text-gray-500 text-base mb-3">
          For your convenience, we've separated the fields into clear sections.
        </p>
        
        {/* Card Type Selector */}
        <div>
          <CardTypeSelect value={cardType} onChange={setCardType} />
        </div>
        
        {/* Card Label */}
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

        {/* Card Number */}
        <div className="relative flex flex-col gap-2">
          <label htmlFor="card-number" className="block font-medium text-gray-700 mb-2">
            Card Number
          </label>
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/90 shadow-inner focus-within:ring-2 ring-finance-blue/40 px-3 py-3">
            <CreditCard className="text-finance-blue mr-2" size={20} />
            <CardNumberElement id="card-number" options={{
              style: { base: { fontSize: "18px", fontFamily: "inherit", color: "#2d2d2d", "::placeholder": { color: "#b7b7b7" } } }
            }} className="flex-1 text-lg bg-gray-50 outline-none border-none"
              aria-label="Card Number"
            />
          </div>
        </div>

        {/* Expiry Date */}
        <div className="relative flex flex-col gap-2">
          <label htmlFor="card-expiry" className="block font-medium text-gray-700 mb-2">
            Expiry Date <span className="text-gray-400 font-normal">(MM/YY)</span>
          </label>
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/90 shadow-inner focus-within:ring-2 ring-finance-blue/40 px-3 py-3">
            <Calendar className="text-finance-blue mr-2" size={20} />
            <CardExpiryElement id="card-expiry" options={{
              style: { base: { fontSize: "18px", fontFamily: "inherit", color: "#2d2d2d", "::placeholder": { color: "#b7b7b7" } } }
            }} className="flex-1 text-lg bg-gray-50 outline-none border-none"
              aria-label="Expiry Date"
            />
          </div>
        </div>

        {/* CVC */}
        <div className="relative flex flex-col gap-2">
          <label htmlFor="card-cvc" className="block font-medium text-gray-700 mb-2 flex items-center gap-1">
            CVC (Security Code)
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Lock className="ml-1 text-gray-400 hover:text-finance-purple cursor-pointer" size={18} tabIndex={0} aria-label="More info" />
                </TooltipTrigger>
                <TooltipContent className="bg-white border shadow-md text-sm font-normal max-w-xs">
                  The 3-digit code on the back of your card. For American Express, it's the 4-digit code on the front.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/90 shadow-inner focus-within:ring-2 ring-finance-blue/40 px-3 py-3">
            <Lock className="text-finance-blue mr-2" size={20} />
            <CardCvcElement id="card-cvc" options={{
              style: { base: { fontSize: "18px", fontFamily: "inherit", color: "#2d2d2d", "::placeholder": { color: "#b7b7b7" } } }
            }} className="flex-1 text-lg bg-gray-50 outline-none border-none"
              aria-label="CVC"
            />
          </div>
        </div>

        {/* Action Buttons */}
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

// Wrapper for loading Stripe.js before using the Card form.
export default function StripeCardFormWrapper(props: { onSuccess: () => void; onCancel: () => void }) {
  const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm {...props} />
    </Elements>
  );
}
