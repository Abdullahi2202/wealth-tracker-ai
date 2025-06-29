
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, QrCode, CreditCard, PlusCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DashboardQuickLinks = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Top Up",
      description: "Add money to wallet",
      icon: ArrowDownLeft,
      color: "bg-green-500 hover:bg-green-600",
      action: () => navigate("/topup-wallet"),
    },
    {
      title: "Send Money",
      description: "Transfer to others",
      icon: Send,
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => navigate("/send-payment"),
    },
    {
      title: "QR Code",
      description: "Scan or share",
      icon: QrCode,
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => navigate("/payments"),
    },
    {
      title: "Cards",
      description: "Manage cards",
      icon: CreditCard,
      color: "bg-indigo-500 hover:bg-indigo-600",
      action: () => navigate("/cards"),
    },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={action.action}
              className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200"
            >
              <div className={`p-3 rounded-full text-white ${action.color} transition-colors duration-200`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900 text-sm">{action.title}</p>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardQuickLinks;
