
// Only show quicklinks on mobile, as sidebar handles desktop navigation
import { useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, BarChart3, User } from "lucide-react";

const DASH_LINKS = [
  { name: "Home", path: "/dashboard", icon: Home },
  { name: "Payments", path: "/payments/home", icon: CreditCard },
  { name: "Analytics", path: "/transactions", icon: BarChart3 },
  { name: "Profile", path: "/profile", icon: User },
];

export default function DashboardQuickLinks() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="w-full max-w-lg mx-auto flex justify-between items-center py-2 md:hidden">
      {DASH_LINKS.map((item) => {
        const isActive =
          item.path === "/dashboard"
            ? location.pathname === "/dashboard"
            : location.pathname.startsWith(item.path);

        return (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            aria-label={item.name}
            type="button"
            className="flex flex-col items-center flex-1 focus:outline-none group"
          >
            <span
              className={`flex items-center justify-center mb-1 rounded-full transition-all duration-200 ${
                isActive ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground group-hover:text-blue-600"
              }`}
              style={{
                width: isActive ? 42 : 36,
                height: isActive ? 42 : 36,
              }}
            >
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.7}
                className="transition-all"
              />
            </span>
            <span
              className={`text-xs font-semibold mt-0.5 transition-colors ${
                isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-blue-600"
              }`}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
