
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Wallet, Banknote, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethodPickerProps {
  value?: string;
  onChange: (id: string) => void;
  label?: string;
  filterType?: "wallet" | "bank" | "card" | "apple_pay" | "google_pay" | "all";
  disabled?: boolean;
  className?: string;
}

export default function PaymentMethodPicker({
  value,
  onChange,
  label = "Pay From",
  filterType = "all",
  disabled = false,
  className = "",
}: PaymentMethodPickerProps) {
  const { methods, loading } = usePaymentMethods();

  const displayed = filterType === "all"
    ? methods
    : methods.filter((m) => m.type === filterType);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm mb-1 font-medium">{label}</label>
      )}
      <select
        className="w-full rounded-md p-2 border bg-background"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={loading || disabled}
      >
        <option value="">Select…</option>
        {displayed.map((method) => (
          <option value={method.id} key={method.id}>
            {method.type === "wallet" && "💰 Wallet"}
            {method.type === "bank" && "🏦 Bank"}
            {method.type === "card" && "💳 Card"}
            {method.type === "apple_pay" && "🍏 Apple Pay"}
            {method.type === "google_pay" && "🤖 Google Pay"}
            {method.label ? ` — ${method.label}` : ""}
          </option>
        ))}
      </select>
      {loading && <div className="text-xs text-muted-foreground mt-1">Loading methods…</div>}
      {displayed.length === 0 && !loading && (
        <div className="text-xs text-muted-foreground mt-1">No methods. Add one in Profile.</div>
      )}
    </div>
  );
}
