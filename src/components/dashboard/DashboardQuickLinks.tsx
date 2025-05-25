
import { useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, BarChart3, User } from "lucide-react";

// Unified navigation for user dashboard (matches sidebar, mobile, and footer)
const DASH_LINKS = [
  {
    name: "Home",
    path: "/dashboard",
    icon: Home,
  },
  {
    name: "Payments",
    path: "/payments/home",
    icon: CreditCard,
  },
  {
    name: "Analytics",
    path: "/transactions",
    icon: BarChart3,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: User,
  },
];

export default function DashboardQuickLinks() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="w-full max-w-lg mx-auto flex justify-between items-center py-2">
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
              className={`flex items-center justify-center mb-1 transition-all 
                ${isActive ? "bg-blue-600 text-white shadow" : "text-zinc-500"}
                rounded-full`}
              style={{
                width: isActive ? 44 : 38,
                height: isActive ? 44 : 38,
              }}
            >
              <item.icon
                size={24}
                strokeWidth={2.2}
                className="transition-all"
              />
            </span>
            <span
              className={`text-xs mt-0.5 font-semibold ${
                isActive
                  ? "text-blue-600"
                  : "text-zinc-500 group-hover:text-blue-600"
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
