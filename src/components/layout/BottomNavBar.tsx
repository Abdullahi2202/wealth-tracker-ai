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

const activeCircleClasses = "bg-blue-600 text-white shadow-md";
const iconClasses = "w-7 h-7";

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex items-center justify-around z-50 md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.path === "/dashboard"
            ? location.pathname === "/dashboard"
            : location.pathname.startsWith(item.path);
        return (
          <button
            key={item.name}
            className="flex flex-col items-center justify-center w-1/4 focus:outline-none group"
            aria-current={isActive ? "page" : undefined}
            onClick={() => navigate(item.path)}
          >
            <div
              className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                isActive ? `${activeCircleClasses}` : "text-muted-foreground group-hover:text-blue-600"
              }`}
              style={{
                width: isActive ? 42 : 36,
                height: isActive ? 42 : 36,
              }}
            >
              <item.icon
                className={iconClasses}
                aria-hidden="true"
                strokeWidth={isActive ? 2.2 : 1.7}
              />
            </div>
            <span className={`text-xs font-semibold mt-0.5 transition-colors ${
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

export default BottomNavBar;
