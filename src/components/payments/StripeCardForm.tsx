
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

// Publishable key for frontend - you need to set this in your Stripe dashboard. For test: pk_test_51RSyix... (replace with your own if using live)
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RSyixH7QCvjpuoqmL9..."; // TODO: Replace with your pk_test key

export function StripeCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  // Get logged in user's email from localStorage
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("walletmaster_user") : null;
  const email = storedUser ? (() => { try { return JSON.parse(storedUser).email; } catch { return ""; } })() : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
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
    const res = await fetch(
      "https://cbhtifqmlkdoevxmbjmm.functions.supabase.co/add-stripe-card",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          label,
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
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-finance-purple mb-1 flex items-center gap-2">
          <CreditCard className="text-finance-purple" size={28} />
          Add your card details
        </h2>
        <p className="text-gray-500 text-base">
          For your convenience, we've separated the fields into three clear sections.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="wallet-card bg-white shadow-lg border border-gray-200 rounded-2xl px-6 py-7 space-y-6 transition animate-fade-in">
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Card display name <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="E.g. My Visa Card"
            className="mb-1"
          />
        </div>

        <div className="flex flex-col gap-5">
          {/* Card Number */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition focus-within:ring-2 ring-finance-purple/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl mr-1">💳</span>
              <span className="text-finance-purple font-semibold text-base">
                Card Number
              </span>
            </div>
            <div className="pl-3">
              <CardNumberElement options={{ style: { base: { fontSize: "18px" } } }} />
            </div>
          </div>
          {/* Expiry Date */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition focus-within:ring-2 ring-finance-purple/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl mr-1">📅</span>
              <span className="text-finance-purple font-semibold text-base">
                Expiry Date
              </span>
            </div>
            <div className="pl-3">
              <CardExpiryElement options={{ style: { base: { fontSize: "18px" } } }} />
            </div>
          </div>
          {/* CVC */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition focus-within:ring-2 ring-finance-purple/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl mr-1">🔐</span>
              <span className="text-finance-purple font-semibold text-base">
                CVC <span className="text-gray-400 font-normal">(Security Code)</span>
              </span>
            </div>
            <div className="pl-3">
              <CardCvcElement options={{ style: { base: { fontSize: "18px" } } }} />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11 font-semibold text-base">Cancel</Button>
          <Button type="submit" className="flex-1 h-11 font-semibold text-base" disabled={loading}>
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
