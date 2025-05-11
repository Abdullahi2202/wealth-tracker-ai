
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Wallet,
  BarChart3,
  User,
  CreditCard,
  ArrowUp,
  ArrowDown,
  PieChart,
  MessageSquare,
  Settings
} from "lucide-react";

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainNavItems = [
    {
      name: "Home",
      icon: Home,
      path: "/dashboard",
    },
    {
      name: "Payments",
      icon: Wallet,
      path: "/payments",
    },
    {
      name: "Analytics",
      icon: BarChart3,
      path: "/transactions",
    },
    {
      name: "Profile",
      icon: User,
      path: "/settings",
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t h-16 px-2 flex items-center justify-around z-50 md:hidden">
      {mainNavItems.map((item) => (
        <button
          key={item.name}
          className="flex flex-col items-center justify-center w-1/4 p-1"
          onClick={() => navigate(item.path)}
        >
          <div 
            className={`rounded-full p-1.5 ${
              location.pathname === item.path 
                ? "bg-secondary text-secondary-foreground" 
                : "text-muted-foreground"
            }`}
          >
            <item.icon size={20} />
          </div>
          <span className="text-xs mt-0.5 font-medium">
            {item.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default MobileNavigation;
