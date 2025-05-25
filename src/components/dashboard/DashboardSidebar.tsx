
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton
} from "@/components/ui/sidebar";
import { Home, CreditCard, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Matches other nav menu icons/pages
const menuItems = [
  {
    label: "Home",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "Payments",
    path: "/payments/home",
    icon: CreditCard
  },
  {
    label: "Analytics",
    path: "/transactions",
    icon: BarChart3
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User
  },
];

export default function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="font-bold text-2xl text-finance-purple px-4 pt-5 pb-2 mb-4">
            Wallet<span className="text-finance-blue">Master</span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.path) || (item.path === "/dashboard" && location.pathname === "/dashboard")}
                  >
                    <button
                      className={cn(
                        "flex items-center w-full gap-3 py-2 px-2 rounded-lg transition-colors",
                        location.pathname.startsWith(item.path) || (item.path === "/dashboard" && location.pathname === "/dashboard")
                          ? "bg-blue-600/10 text-blue-600 font-bold"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => navigate(item.path)}
                      aria-label={item.label}
                    >
                      <item.icon
                        className={cn(
                          "w-6 h-6",
                          location.pathname.startsWith(item.path) || (item.path === "/dashboard" && location.pathname === "/dashboard")
                            ? "text-blue-600"
                            : "text-gray-500"
                        )}
                        strokeWidth={2}
                      />
                      <span>{item.label}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
