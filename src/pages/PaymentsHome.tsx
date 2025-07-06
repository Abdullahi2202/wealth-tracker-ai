
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreditCard, Download, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddCardDrawer from "@/components/payments/AddCardDrawer";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [addCardOpen, setAddCardOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <DashboardLayout>
      <div className={`w-full pt-4 pb-20 px-3 animate-fade-in ${isMobile ? 'max-w-full' : 'max-w-md mx-auto pt-8'}`}>
        <h1 className={`text-center font-extrabold mb-6 text-finance-purple ${isMobile ? 'text-2xl' : 'text-3xl mb-8'}`}>
          Payments
        </h1>
        <div className={`space-y-5 ${isMobile ? 'space-y-4' : 'space-y-7'}`}>
          {actionCards.map(({ title, description, Icon, route, bg }) => (
            <button
              key={title}
              onClick={() => navigate(route)}
              className={`${bg} w-full flex items-center gap-4 rounded-2xl shadow-lg p-5 mb-3 active:scale-95 transition-transform focus:outline-none ${isMobile ? 'min-h-[90px] gap-3 p-4' : 'min-h-[110px] gap-5 p-6'}`}
            >
              <span className={`flex items-center justify-center bg-white/20 rounded-full ${isMobile ? 'p-3 mr-1' : 'p-5 mr-2'}`}>
                <Icon size={isMobile ? 28 : 34} className="text-white drop-shadow" />
              </span>
              <div className="text-left flex-1">
                <div className={`font-bold text-white mb-1 ${isMobile ? 'text-base' : 'text-lg'}`}>{title}</div>
                <div className={`text-white/90 leading-snug ${isMobile ? 'text-xs' : 'text-xs'}`}>{description}</div>
              </div>
            </button>
          ))}
          <button
            onClick={() => setAddCardOpen(true)}
            className={`border w-full flex items-center justify-center rounded-2xl shadow-sm text-finance-purple gap-3 bg-background hover:bg-muted transition ${isMobile ? 'min-h-[50px] p-4 text-base' : 'min-h-[54px] p-5 text-lg mt-3'}`}
          >
            <span className="font-bold">＋ Add Card</span>
          </button>
          <AddCardDrawer open={addCardOpen} onOpenChange={setAddCardOpen} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsHome;
