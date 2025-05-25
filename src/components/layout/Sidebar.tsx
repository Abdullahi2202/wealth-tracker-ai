
// Sidebar (desktop, mobile) shown on every main page, matching nav layout/logo
import { useNavigate, useLocation } from "react-router-dom";
import { CreditCard, BarChart3, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  const renderMenuItem = (item) => {
    const isActive = item.path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(item.path);

    return (
      <Button
        key={item.name}
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start mb-1 flex items-center gap-3 py-2 px-3 rounded-lg transition-colors font-medium",
          isActive
            ? "bg-blue-600/10 text-blue-600 font-bold"
            : "hover:bg-muted/50 text-zinc-800"
        )}
        onClick={() => navigate(item.path)}
        tabIndex={0}
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
      <div className="px-4 py-2">
        <div className="font-bold text-2xl text-finance-purple mb-4">
          Wallet<span className="text-finance-blue">Master</span>
        </div>
        <h2 className="text-lg font-semibold mb-3">Navigation</h2>
      </div>
      <div className="px-3 py-2 flex-1 overflow-auto">
        <div className="space-y-1">
          {mainMenuItems.map(renderMenuItem)}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
