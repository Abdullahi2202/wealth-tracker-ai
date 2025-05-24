
import { useNavigate } from "react-router-dom";
import { CreditCard, Download, Plus } from "lucide-react";

const actionCards = [
  {
    title: "Send Payment",
    description: "Transfer money securely to anyone.",
    color: "from-blue-500 to-blue-700",
    Icon: CreditCard,
    route: "/payments/send",
    bg: "bg-gradient-to-br from-blue-500 to-blue-700",
  },
  {
    title: "Top-Up Wallet",
    description: "Add funds via card or bank.",
    color: "from-orange-400 to-yellow-500",
    Icon: Plus,
    route: "/payments/topup",
    bg: "bg-gradient-to-br from-orange-400 to-yellow-500",
  },
  {
    title: "Received Payments",
    description: "View your incoming transactions.",
    color: "from-green-500 to-teal-600",
    Icon: Download,
    route: "/payments/received",
    bg: "bg-gradient-to-br from-green-500 to-teal-600",
  },
];

const PaymentsHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center px-3 py-6 animate-fade-in">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-center text-3xl font-extrabold mb-6 text-finance-purple">
          Payments
        </h1>
        <div className="space-y-6">
          {actionCards.map(({ title, description, Icon, route, bg }) => (
            <button
              key={title}
              onClick={() => navigate(route)}
              className={`${bg} w-full flex items-center gap-4 rounded-xl shadow-md p-5 mb-2 active:scale-95 transition-transform focus:outline-none`}
              style={{ minHeight: 100 }}
            >
              <span className="flex items-center justify-center bg-white/20 rounded-full p-4 mr-2">
                <Icon size={32} className="text-white drop-shadow" />
              </span>
              <div className="text-left flex-1">
                <div className="text-lg font-bold text-white mb-1">{title}</div>
                <div className="text-xs text-white/90">{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentsHome;
