

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

// Use your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RXgVBRhotlUiiXdPUuoNpTNFEyH8HNLK9jFVg4lcrobEoNKtwH1QFUI4pWLCsMUFurVQEfrFxPahW8lDilmrp2j00iibXBiw8";

export function StripeCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardType, setCardType] = useState<CardType>("visa");

  // Get logged in user's email from localStorage
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("walletmaster_user") : null;
  const email = storedUser ? (() => { try { return JSON.parse(storedUser).email; } catch { return ""; } })() : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error("Stripe is not loaded. Please check your Stripe configuration.");
      return;
    }
    setLoading(true);

    const numberElement = elements.getElement(CardNumberElement);
    const expiryElement = elements.getElement(CardExpiryElement);
    const cvcElement = elements.getElement(CardCvcElement);
    if (!numberElement || !expiryElement || !cvcElement) {
      toast.error("Card form not loaded.");
      setLoading(false);
      return;
    }

    // 1. Create PaymentMethod with Stripe.js using individual elements
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: numberElement,
      billing_details: { email }
    });
    if (error || !paymentMethod) {
      toast.error(error ? error.message : "Failed to create payment method");
      setLoading(false);
      return;
    }
    
    // 2. Call Supabase Edge Function to vault and save method
    try {
      const res = await fetch(
        "https://cbhtifqmlkdoevxmbjmm.supabase.co/functions/v1/add-stripe-card",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("sb-cbhtifqmlkdoevxmbjmm-auth-token") || ""}`
          },
          body: JSON.stringify({
            email,
            label: label || `${cardType} Card`,
            paymentMethodId: paymentMethod.id,
          }),
        }
      );
      
      if (res.ok) {
        toast.success("Card added securely! You can now use it for payments.");
        setLoading(false);
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || "Card addition failed.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("Failed to add card. Please try again.");
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 h-11 font-semibold text-base bg-finance-purple hover:bg-finance-indigo text-white shadow-md"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Card"}
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

