
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, CreditCard, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home
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
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.path)}
                  >
                    <button
                      className={cn(
                        "flex items-center w-full",
                        location.pathname.startsWith(item.path)
                          ? "bg-finance-purple/10"
                          : ""
                      )}
                      onClick={() => navigate(item.path)}
                      aria-label={item.label}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
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

