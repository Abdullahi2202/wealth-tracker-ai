
import { useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, BarChart3, User } from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Home",
    icon: Home,
    path: "/dashboard",
  },
  {
    name: "Payment",
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
    path: "/settings",
  },
];

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex items-center justify-around z-50 md:hidden">
      {NAV_ITEMS.map((item) => {
        // Special handling for active "Payment" routes
        const isPaymentActive = item.name === "Payment" &&
          (location.pathname.startsWith("/payments"));
        const isActive =
          item.path === location.pathname ||
          isPaymentActive;

        return (
          <button
            key={item.name}
            className={`flex flex-col items-center justify-center w-1/4 text-xs font-medium transition-colors ${
              isActive
                ? "text-finance-purple"
                : "text-muted-foreground"
            } focus:outline-none`}
            onClick={() => navigate(item.path)}
            aria-current={isActive ? "page" : undefined}
          >
            <div
              className={`rounded-full p-2 mb-1 transition-all duration-150 ${
                isActive
                  ? "bg-finance-purple/15 text-finance-purple shadow-md scale-110"
                  : "bg-transparent"
              }`}
            >
              <item.icon size={24} />
            </div>
            <span
              className={`${
                isActive ? "font-bold" : ""
              }`}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;

