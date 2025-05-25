
import { Home, CreditCard, BarChart3, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DASH_LINKS = [
  {
    name: "Home",
    icon: Home,
    path: "/dashboard",
    color: "bg-finance-purple/80",
  },
  {
    name: "Payment",
    icon: CreditCard,
    path: "/payments/home",
    color: "bg-finance-blue/80",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    path: "/transactions",
    color: "bg-emerald-600/80",
  },
  {
    name: "Profile",
    icon: User,
    path: "/settings",
    color: "bg-amber-500/80",
  },
];

export default function DashboardQuickLinks() {
  const navigate = useNavigate();
  return (
    <section
      className="w-full max-w-xl mx-auto mt-7 grid grid-cols-2 sm:grid-cols-4 gap-5"
      aria-label="Quick dashboard links"
    >
      {DASH_LINKS.map((item) => (
        <button
          key={item.name}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center justify-center gap-1.5 py-5 rounded-lg shadow group transition hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-finance-purple/90 ${item.color}`}
          aria-label={item.name}
          type="button"
        >
          <item.icon
            className="w-7 h-7 mb-1 text-white drop-shadow group-hover:animate-bounce"
            aria-hidden="true"
          />
          <span className="text-white font-semibold text-[15px] tracking-wide drop-shadow">
            {item.name}
          </span>
        </button>
      ))}
    </section>
  );
}
