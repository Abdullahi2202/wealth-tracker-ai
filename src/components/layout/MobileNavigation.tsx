import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, CreditCard, BarChart3, User
} from "lucide-react";

// Unified mobile main nav with consistent styling and icon states
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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex items-center justify-around z-50 md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = item.path === "/dashboard" 
          ? location.pathname === "/dashboard"
          : location.pathname.startsWith(item.path);
        return (
          <button
            key={item.name}
            className="flex flex-col items-center justify-center w-1/4 p-1 group focus:outline-none"
            onClick={() => navigate(item.path)}
            aria-current={isActive ? "page" : undefined}
          >
            <div 
              className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-muted-foreground group-hover:text-blue-600"
              }`}
              style={{
                width: isActive ? 42 : 36,
                height: isActive ? 42 : 36,
              }}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.7} />
            </div>
            <span className={`mt-0.5 text-xs font-semibold transition-colors ${
              isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-blue-600"
            }`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNavigation;
