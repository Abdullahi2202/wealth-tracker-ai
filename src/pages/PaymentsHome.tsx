
import { useNavigate } from "react-router-dom";
import { CreditCard, DollarSign, ArrowDown, ArrowLeft, Plus } from "lucide-react";

const actionCards = [
  {
    title: "Send Payment",
    description: "Transfer money securely to anyone.",
    color: "from-blue-500 to-blue-700",
    Icon: CreditCard,
    route: "/payments/send",
    bg: "bg-gradient-to-br from-blue-500 to-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  {
    title: "Top-Up Wallet",
    description: "Add funds via card or bank.",
    color: "from-orange-400 to-yellow-500",
    Icon: Plus,
    route: "/payments/topup",
    bg: "bg-gradient-to-br from-orange-400 to-yellow-500",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Received Payments",
    description: "View your incoming transactions.",
    color: "from-green-500 to-teal-600",
    Icon: ArrowDown,
    route: "/payments/received",
    bg: "bg-gradient-to-br from-green-500 to-teal-600",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
];

const PaymentsHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center px-3 py-6 animate-fade-in">
      {/* Top Bar with Back button */}
      <div className="w-full max-w-md mx-auto flex items-center gap-2 mb-5">
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
        {/* placeholder for spacing symmetry */}
        <span className="w-9" />
      </div>
      {/* Action Cards Grid */}
      <div className="w-full max-w-md mx-auto grid gap-6">
        {actionCards.map(({ title, description, Icon, route, bg, iconBg, iconColor }) => (
          <button
            key={title}
            onClick={() => navigate(route)}
            className={`group relative ${bg} w-full flex items-center gap-5 rounded-2xl shadow-lg p-5 hover-scale transition hover:shadow-xl hover:brightness-105 focus-visible:ring-2 focus:outline-none active:scale-98`}
            style={{ minHeight: 108 }}
            aria-label={title}
          >
            <span className={`flex items-center justify-center ${iconBg} rounded-full p-4 shadow-inner mr-2 transition-all`}>
              <Icon size={40} className={`${iconColor} drop-shadow-lg`} />
            </span>
            <div className="text-left flex-1">
              <div className="text-lg md:text-xl font-bold text-white mb-1 drop-shadow">{title}</div>
              <div className="text-xs md:text-sm text-white/90 opacity-90">{description}</div>
            </div>
            {/* Arrow Indicator */}
            <span className="absolute right-5 top-1/2 -translate-y-1/2 opacity-90">
              <DollarSign className="h-6 w-6 text-white/60 group-hover:text-white/80 transition" />
            </span>
          </button>
        ))}
      </div>

      {/* Advanced footer (example for extensibility) */}
      <div className="mt-12 text-sm text-muted-foreground w-full text-center opacity-75">
        Secure &middot; Fast &middot; Mobile Friendly <br />
        <span className="font-medium">More features coming soon!</span>
      </div>
    </div>
  );
};

export default PaymentsHome;

