import { useNavigate, useLocation } from "react-router-dom";
import { 
  CreditCard, 
  PieChart, 
  BarChart3, 
  ArrowLeftRight, 
  MessageSquare,
  Settings, 
  Home,
  Wallet,
  User,
  ArrowUp,
  ArrowDown,
  LineChart,
  PiggyBank,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole"; // FIX: use proper ES module import

const mainMenuItems = [
  {
    name: "Home",
    icon: Home,
    path: "/dashboard",
  },
  {
    name: "Payments",
    icon: CreditCard,
    path: "/payments/home",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    path: "/transactions",
  },
  {
    name: "Profile",
    icon: User,
    path: "/profile",
  }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [openPayments, setOpenPayments] = useState(false);
  const [openAnalytics, setOpenAnalytics] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  
  // Use the hook directly
  const role = useUserRole();

  const renderMenuItem = (item) => {
    const isActive = item.path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(item.path);

    return (
      <Button
        key={item.name}
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start mb-1 flex items-center gap-3 py-2 px-2 rounded-lg transition-colors",
          isActive
            ? "bg-blue-600/10 text-blue-600 font-bold"
            : "hover:bg-muted/50"
        )}
        onClick={() => navigate(item.path)}
      >
        <item.icon className={cn(
          "w-6 h-6",
          isActive
            ? "text-blue-600"
            : "text-gray-500"
        )} strokeWidth={2} />
        {item.name}
      </Button>
    );
  };

  return (
    <div className="flex flex-col h-full pt-2">
      <div className="px-3 py-2 md:hidden">
        <div className="font-bold text-xl text-finance-purple mb-4">
          Wallet<span className="text-finance-blue">Master</span>
        </div>
      </div>
      <div className="px-3 py-2 flex-1 overflow-auto">
        <h2 className="mb-3 px-4 text-lg font-semibold tracking-tight">
          Navigation
        </h2>
        <div className="space-y-1">
          {mainMenuItems.map(renderMenuItem)}
          {role === "admin" && (
            <Button
              key="admin"
              variant="ghost"
              className="w-full justify-start mb-1 hover:bg-secondary/10"
              onClick={() => window.location.href = "/admin"}
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin Panel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
