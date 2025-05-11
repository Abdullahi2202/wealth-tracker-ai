
import { useNavigate, useLocation } from "react-router-dom";
import { 
  CreditCard, 
  PieChart, 
  BarChart3, 
  ArrowLeftRight, 
  MessageSquare,
  Settings, 
  Home,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    {
      name: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
    {
      name: "Cards",
      icon: CreditCard,
      path: "/cards",
    },
    {
      name: "Payments",
      icon: Wallet,
      path: "/payments",
    },
    {
      name: "Expenses",
      icon: PieChart,
      path: "/expenses",
    },
    {
      name: "Budget",
      icon: BarChart3, 
      path: "/budget",
    },
    {
      name: "Transactions",
      icon: ArrowLeftRight,
      path: "/transactions",
    },
    {
      name: "AI Assistant",
      icon: MessageSquare,
      path: "/assistant",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    }
  ];

  return (
    <div className="flex flex-col h-full pt-2">
      <div className="px-3 py-2 md:hidden">
        <div className="font-bold text-xl text-finance-purple mb-4">
          Wallet<span className="text-finance-blue">Master</span>
        </div>
      </div>
      
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Navigation
        </h2>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.name}
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                location.pathname === item.path 
                  ? "bg-secondary text-white" 
                  : "hover:bg-secondary/10"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
