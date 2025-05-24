
import { useNavigate } from "react-router-dom";
import { CreditCard, Plus, ArrowDown, ArrowLeft } from "lucide-react";

const actionCards = [
  {
    title: "Send Payment",
    route: "/payments/send",
    bg: "bg-gradient-to-br from-blue-500 to-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    Icon: CreditCard,
    iconTestId: "send-payment-icon"
  },
  {
    title: "Top-Up Wallet",
    route: "/payments/topup",
    bg: "bg-gradient-to-br from-orange-400 to-yellow-400",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    Icon: Plus,
    iconTestId: "topup-wallet-icon"
  },
  {
    title: "Received Payments",
    route: "/payments/received",
    bg: "bg-gradient-to-br from-green-500 to-teal-600",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    Icon: ArrowDown,
    iconTestId: "received-payments-icon"
  },
];

const PaymentsHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center px-4 py-6 animate-fade-in">
      {/* Top Bar with Back button */}
      <div className="w-full max-w-md mx-auto flex items-center gap-2 mb-7">
        <button
          title="Back"
          className="rounded-full p-2 bg-white/80 shadow hover:bg-white focus-visible:ring-2 focus:outline-none transition-all"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 text-finance-purple" />
        </button>
        <h1 className="flex-1 text-center text-3xl font-extrabold text-finance-purple tracking-tight">
          Payments
        </h1>
        {/* placeholder for symmetry */}
        <span className="w-9" />
      </div>
      {/* Main Action Grid */}
      <div className="w-full max-w-md mx-auto grid grid-cols-1 gap-7">
        {actionCards.map(({ title, route, bg, iconBg, iconColor, Icon, iconTestId }) => (
          <button
            key={title}
            onClick={() => navigate(route)}
            className={`
              group flex flex-col items-center justify-center
              ${bg} rounded-2xl shadow-lg px-0 py-7
              hover-scale transition hover:shadow-xl hover:brightness-105
              active:scale-98 focus-visible:ring-2 focus:outline-none
            `}
            style={{ minHeight: 136 }}
            aria-label={title}
            tabIndex={0}
          >
            <span
              className={`flex items-center justify-center ${iconBg} rounded-full shadow-inner transition-all mb-3`}
              style={{ width: 62, height: 62 }}
              data-testid={iconTestId}
            >
              <Icon size={38} className={`${iconColor} drop-shadow-lg`} aria-hidden />
            </span>
            <span className="text-lg md:text-xl font-bold text-white drop-shadow-sm tracking-wide">
              {title}
            </span>
          </button>
        ))}
      </div>
      {/* Footer */}
      <div className="mt-16 text-xs text-muted-foreground w-full text-center opacity-80">
        Simple. Fast. Secure.
        <br />
        <span className="font-medium text-xs opacity-75">More payment options coming soon.</span>
      </div>
    </div>
  );
};

export default PaymentsHome;

