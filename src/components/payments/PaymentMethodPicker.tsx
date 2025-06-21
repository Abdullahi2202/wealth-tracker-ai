
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

  const formatMethodLabel = (method: any) => {
    let icon = "";
    let displayName = "";
    
    switch (method.type) {
      case "wallet":
        icon = "💰";
        displayName = "Wallet";
        break;
      case "bank":
        icon = "🏦";
        displayName = "Bank";
        break;
      case "card":
        icon = "💳";
        displayName = method.brand ? 
          `${method.brand.charAt(0).toUpperCase() + method.brand.slice(1)}` : 
          "Card";
        // Add last 4 digits if available
        if (method.last4) {
          displayName += ` **** ${method.last4}`;
        }
        break;
      case "apple_pay":
        icon = "🍏";
        displayName = "Apple Pay";
        break;
      case "google_pay":
        icon = "🤖";
        displayName = "Google Pay";
        break;
      default:
        icon = "💳";
        displayName = "Payment Method";
    }

    return `${icon} ${displayName}${method.label && method.type !== "card" ? ` — ${method.label}` : ""}`;
  };

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
            {formatMethodLabel(method)}
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
