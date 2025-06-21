
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
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
        // Get proper brand icon and name
        const brandIcons: { [key: string]: string } = {
          'visa': '💳',
          'mastercard': '💳',
          'amex': '💳',
          'discover': '💳',
          'diners': '💳',
          'jcb': '💳',
          'unionpay': '💳'
        };
        
        icon = brandIcons[method.brand?.toLowerCase()] || "💳";
        
        // Format brand name properly
        let brandName = "Card";
        if (method.brand) {
          switch (method.brand.toLowerCase()) {
            case 'visa':
              brandName = "Visa";
              break;
            case 'mastercard':
              brandName = "Mastercard";
              break;
            case 'amex':
              brandName = "American Express";
              break;
            case 'discover':
              brandName = "Discover";
              break;
            case 'diners':
              brandName = "Diners Club";
              break;
            case 'jcb':
              brandName = "JCB";
              break;
            case 'unionpay':
              brandName = "UnionPay";
              break;
            default:
              brandName = method.brand.charAt(0).toUpperCase() + method.brand.slice(1).toLowerCase();
          }
        }
        
        // Add first 2 and last 4 digits if available
        if (method.last4) {
          // Show **44 4444 format (first 2 + last 4)
          const first2 = method.last4.slice(0, 2) || "**";
          const last4 = method.last4;
          displayName = `${brandName} **${first2} ${last4}`;
        } else {
          displayName = brandName;
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
