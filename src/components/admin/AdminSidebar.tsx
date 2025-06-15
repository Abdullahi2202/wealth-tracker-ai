
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Users, BarChart3, Shield, CreditCard, Settings, Activity, FolderOpen, ChevronRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
    description: "Dashboard & Analytics",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    description: "User Management",
    color: "from-emerald-500 to-emerald-600", 
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  {
    id: "transactions", 
    label: "Transactions",
    icon: CreditCard,
    description: "Payment Management",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50", 
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  {
    id: "content",
    label: "Content",
    icon: FolderOpen,
    description: "Content Management", 
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700", 
    borderColor: "border-orange-200",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "System Configuration",
    color: "from-slate-500 to-slate-600",
    bgColor: "bg-slate-50",
    textColor: "text-slate-700",
    borderColor: "border-slate-200",
  },
  {
    id: "activity",
    label: "Activity",
    icon: Activity,
    description: "Activity Tracking",
    color: "from-rose-500 to-rose-600",
    bgColor: "bg-rose-50", 
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
  },
];

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r-0 bg-white shadow-xl"
    >
      <SidebarContent className="bg-gradient-to-b from-slate-50 to-white">
        {/* Navigation Menu */}
        <SidebarGroup className="p-6 flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      tooltip={isCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full p-0 rounded-2xl transition-all duration-300 group hover:shadow-lg min-h-[70px] border-2 relative overflow-hidden",
                        isActive
                          ? `${item.bgColor} ${item.textColor} ${item.borderColor} shadow-lg scale-[1.02]`
                          : "hover:bg-white hover:shadow-md border-transparent hover:border-slate-200 bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-center gap-4 w-full p-4 relative z-10">
                        <div className={cn(
                          "p-2.5 rounded-xl transition-all duration-300",
                          isActive 
                            ? `bg-gradient-to-br ${item.color} text-white shadow-lg` 
                            : "bg-white text-slate-500 group-hover:text-slate-700 shadow-sm"
                        )}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        
                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className={cn(
                              "font-bold text-sm truncate mb-0.5",
                              isActive ? item.textColor : "text-slate-900"
                            )}>
                              {item.label}
                            </div>
                            <div className={cn(
                              "text-xs truncate font-medium",
                              isActive ? `${item.textColor} opacity-80` : "text-slate-500"
                            )}>
                              {item.description}
                            </div>
                          </div>
                        )}

                        {!isCollapsed && (
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-all duration-300",
                            isActive 
                              ? `${item.textColor} rotate-90` 
                              : "text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1"
                          )} />
                        )}
                      </div>

                      {/* Active indicator line */}
                      {isActive && (
                        <div className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full",
                          `bg-gradient-to-b ${item.color}`
                        )} />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pro Footer */}
        {!isCollapsed && (
          <div className="p-6 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-bold text-sm">Enterprise</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Advanced admin controls & analytics
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
