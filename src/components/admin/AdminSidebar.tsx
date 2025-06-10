
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Users, CreditCard, AlertTriangle, MessageSquare, BarChart3, FileText, Activity, Shield } from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    id: "users",
    label: "User Management",
    icon: Users,
    description: "Manage users & accounts",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: CreditCard,
    description: "Monitor transactions",
  },
  {
    id: "fraud",
    label: "Fraud Alerts",
    icon: AlertTriangle,
    description: "Security & fraud detection",
  },
  {
    id: "support",
    label: "Support Tickets",
    icon: FileText,
    description: "Customer support",
  },
  {
    id: "chatbot",
    label: "Chatbot Analytics",
    icon: MessageSquare,
    description: "AI assistant logs",
  },
  {
    id: "metrics",
    label: "System Metrics",
    icon: BarChart3,
    description: "Performance analytics",
  },
  {
    id: "logs",
    label: "Activity Logs",
    icon: Activity,
    description: "Audit trail",
  },
];

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Wallet<span className="text-blue-600">Master</span>
              </h2>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <SidebarGroup className="p-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "w-full p-4 rounded-lg transition-all duration-200 group",
                        isActive
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                          : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                          )}
                        />
                        <div className="flex-1 text-left">
                          <div className={cn(
                            "font-medium text-sm",
                            isActive ? "text-blue-900" : "text-slate-900"
                          )}>
                            {item.label}
                          </div>
                          <div className={cn(
                            "text-xs mt-0.5",
                            isActive ? "text-blue-600" : "text-slate-500"
                          )}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
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
      </SidebarContent>
    </Sidebar>
  );
}
