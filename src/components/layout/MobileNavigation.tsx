
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, CreditCard, BarChart3, User
} from "lucide-react";

// Unified mobile main nav
const NAV_ITEMS = [
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

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t h-16 px-2 flex items-center justify-around z-50 md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname.startsWith(item.path) || (item.path === "/dashboard" && location.pathname === "/dashboard");
        return (
          <button
            key={item.name}
            className="flex flex-col items-center justify-center w-1/4 p-1"
            onClick={() => navigate(item.path)}
          >
            <div 
              className={`rounded-full p-1.5 ${
                isActive 
                  ? "bg-blue-600 text-white shadow" 
                  : "text-muted-foreground"
              }`}
              style={{
                width: isActive ? 40 : 34,
                height: isActive ? 40 : 34,
              }}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.7} />
            </div>
            <span className={`text-xs mt-0.5 font-medium ${isActive ? "text-blue-600" : "text-muted-foreground"}`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileNavigation;
