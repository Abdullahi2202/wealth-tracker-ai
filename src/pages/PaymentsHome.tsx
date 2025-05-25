
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreditCard, Download, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Action cards for Payments Home
const actionCards = [
  {
    title: "Send Payment",
    description: "Transfer money securely to anyone.",
    Icon: CreditCard,
    route: "/payments/send",
    bg: "bg-gradient-to-br from-blue-500 to-blue-700",
  },
  {
    title: "Top-Up Wallet",
    description: "Add funds via card or bank.",
    Icon: Plus,
    route: "/payments/topup",
    bg: "bg-gradient-to-br from-orange-400 to-yellow-500",
  },
  {
    title: "Received Payments",
    description: "View your incoming transactions.",
    Icon: Download,
    route: "/payments/received",
    bg: "bg-gradient-to-br from-green-500 to-teal-600",
  },
];

const PaymentsHome = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="w-full max-w-md mx-auto pt-8 pb-20 px-3 animate-fade-in">
        <h1 className="text-center text-3xl font-extrabold mb-8 text-finance-purple">
          Payments
        </h1>
        <div className="space-y-7">
          {actionCards.map(({ title, description, Icon, route, bg }) => (
            <button
              key={title}
              onClick={() => navigate(route)}
              className={`${bg} w-full flex items-center gap-5 rounded-2xl shadow-lg p-6 mb-3 active:scale-95 transition-transform focus:outline-none`}
              style={{ minHeight: 110 }}
            >
              <span className="flex items-center justify-center bg-white/20 rounded-full p-5 mr-2">
                <Icon size={34} className="text-white drop-shadow" />
              </span>
              <div className="text-left flex-1">
                <div className="text-lg font-bold text-white mb-1">{title}</div>
                <div className="text-xs text-white/90 leading-snug">{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsHome;

