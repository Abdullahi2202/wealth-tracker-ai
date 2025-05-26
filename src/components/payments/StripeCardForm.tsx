
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Publishable key for frontend - you need to set this in your Stripe dashboard. For test: pk_test_51RSyix... (replace with your own if using live)
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RSyixH7QCvjpuoqmL9..."; // TODO: Replace with your pk_test key

export function StripeCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  // Get logged in user's email from localStorage (or from auth context, if available)
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("walletmaster_user") : null;
  const email = storedUser ? (() => { try { return JSON.parse(storedUser).email; } catch { return ""; } })() : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Card form not loaded.");
      setLoading(false);
      return;
    }
    // 1. Create PaymentMethod with Stripe.js
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
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
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <label className="block text-sm">Card display name (optional)</label>
      <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="My Visa Card" />
      <div className="border p-2 rounded">
        <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: "16px" } } }} />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Saving..." : "Save Card"}</Button>
      </div>
    </form>
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
