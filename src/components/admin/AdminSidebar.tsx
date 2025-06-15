
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Users, BarChart3, Shield, CreditCard, Settings, Activity, FolderOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    id: "overview",
    label: "Overview Dashboard",
    icon: BarChart3,
    description: "Stats and analytics",
  },
  {
    id: "users",
    label: "User Management",
    icon: Users,
    description: "Manage users & verification",
  },
  {
    id: "transactions",
    label: "Transaction Management",
    icon: CreditCard,
    description: "View & manage transactions",
  },
  {
    id: "content",
    label: "Content Management",
    icon: FolderOpen,
    description: "Categories & content",
  },
  {
    id: "settings",
    label: "App Settings",
    icon: Settings,
    description: "System configuration",
  },
  {
    id: "activity",
    label: "Activity Tracking",
    icon: Activity,
    description: "User activity logs",
  },
];

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-slate-200 bg-white shadow-sm"
    >
      <SidebarContent>
        {/* Logo/Brand */}
        <div className={cn(
          "p-6 border-b border-slate-200 transition-all duration-200",
          isCollapsed && "p-4"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
              <Shield className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  Wallet<span className="text-blue-600">Master</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="p-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      tooltip={isCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full p-3 rounded-xl transition-all duration-200 group hover:shadow-sm",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                          : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-colors flex-shrink-0",
                            isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                          )}
                        />
                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className={cn(
                              "font-medium text-sm truncate",
                              isActive ? "text-blue-900" : "text-slate-900"
                            )}>
                              {item.label}
                            </div>
                            <div className={cn(
                              "text-xs mt-0.5 truncate",
                              isActive ? "text-blue-600" : "text-slate-500"
                            )}>
                              {item.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {!isCollapsed && (
          <div className="mt-auto p-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-500">
                © 2024 WalletMaster
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Admin Dashboard v1.0
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
