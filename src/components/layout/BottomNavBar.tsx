
import { useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, BarChart3, User } from "lucide-react";

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
  },
];

const activeCircleClasses = "bg-blue-600 text-white shadow-lg";
const iconClasses = "w-7 h-7";

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t h-20 flex items-center justify-around z-50 md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.path === "/dashboard"
            ? location.pathname === "/dashboard"
            : location.pathname.startsWith(item.path);
        return (
          <button
            key={item.name}
            className="flex flex-col items-center justify-center w-1/4 focus:outline-none"
            aria-current={isActive ? "page" : undefined}
            onClick={() => navigate(item.path)}
          >
            <div
              className={`flex items-center justify-center mb-1 rounded-full transition-all duration-200 ${
                isActive ? `${activeCircleClasses}` : "text-muted-foreground"
              }`}
              style={{
                width: isActive ? 45 : 38,
                height: isActive ? 45 : 38,
                backgroundColor: isActive ? "#2563eb" : "transparent" // Tailwind blue-600
              }}
            >
              <item.icon
                className={iconClasses}
                aria-hidden="true"
                strokeWidth={isActive ? 2.2 : 1.7}
              />
            </div>
            <span className={`text-xs tracking-tight ${isActive ? "text-black font-semibold" : "text-muted-foreground"}`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;

