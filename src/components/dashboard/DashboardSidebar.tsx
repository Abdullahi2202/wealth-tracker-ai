
// Sidebar for desktop and mobile, matching the WalletMaster branding and nav order

import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home, CreditCard, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "Home",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "Payments",
    path: "/payments/home",
    icon: CreditCard,
  },
  {
    label: "Analytics",
    path: "/transactions",
    icon: BarChart3,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
  },
];

export default function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar>
      {/* Sidebar Toggle Button */}
      <div className="flex items-center gap-2 pl-4 pt-5">
        <SidebarTrigger />
        <div className="font-bold text-2xl text-finance-purple">
          Wallet<span className="text-finance-blue">Master</span>
        </div>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <h2 className="mb-3 px-4 text-lg font-semibold tracking-tight mt-4">Navigation</h2>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = item.path === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <button
                        className={cn(
                          "flex items-center w-full gap-3 py-2 px-3 rounded-lg transition-colors font-medium",
                          isActive
                            ? "bg-blue-600/10 text-blue-600 font-bold"
                            : "hover:bg-muted/50 text-zinc-800"
                        )}
                        onClick={() => navigate(item.path)}
                        aria-label={item.label}
                        tabIndex={0}
                      >
                        <item.icon
                          className={cn(
                            "w-6 h-6",
                            isActive
                              ? "text-blue-600"
                              : "text-gray-500"
                          )}
                          strokeWidth={2}
                        />
                        <span>{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
