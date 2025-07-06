
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, CreditCard, BarChart3, User, Bot
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", icon: Home, path: "/dashboard" },
  { name: "Payments", icon: CreditCard, path: "/payments/home" },
  { name: "Analytics", icon: BarChart3, path: "/transactions" },
  { name: "Assistant", icon: Bot, path: "/assistant" },
  { name: "Profile", icon: User, path: "/profile" }
];

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around z-50 md:hidden shadow-lg safe-area-bottom"
      style={{
        height: 'calc(4rem + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.path === "/dashboard"
          ? location.pathname === "/dashboard"
          : location.pathname.startsWith(item.path);
        return (
          <button
            key={item.name}
            className="flex flex-col items-center justify-center flex-1 p-2 group focus:outline-none transition-all duration-200 min-h-0"
            onClick={() => navigate(item.path)}
            aria-current={isActive ? "page" : undefined}
          >
            <div
              className={`rounded-full transition-all duration-200 flex items-center justify-center shadow-sm ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50"
              }`}
              style={{
                width: isActive ? 36 : 32,
                height: isActive ? 36 : 32,
              }}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
            </div>
            <span className={`mt-1 text-xs font-medium transition-colors truncate max-w-full ${
              isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
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
