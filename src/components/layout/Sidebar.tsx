
import { useNavigate, useLocation } from "react-router-dom";
import { 
  CreditCard, 
  PieChart, 
  BarChart3, 
  ArrowLeftRight, 
  MessageSquare,
  Settings, 
  Home,
  Wallet,
  User,
  ArrowUp,
  ArrowDown,
  LineChart,
  PiggyBank,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole"; // FIX: use proper ES module import

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [openPayments, setOpenPayments] = useState(false);
  const [openAnalytics, setOpenAnalytics] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  
  const mainMenuItems = [
    {
      name: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
    {
      name: "Payments",
      icon: Wallet,
      isSubmenu: true,
      stateHandler: setOpenPayments,
      isOpen: openPayments,
      subItems: [
        {
          name: "Cards",
          icon: CreditCard,
          path: "/cards",
        },
        {
          name: "Send Money",
          icon: ArrowUp,
          path: "/payments",
        },
        {
          name: "Request Money",
          icon: ArrowDown,
          path: "/payments?tab=request",
        }
      ]
    },
    {
      name: "Analytics",
      icon: BarChart3,
      isSubmenu: true,
      stateHandler: setOpenAnalytics,
      isOpen: openAnalytics,
      subItems: [
        {
          name: "Transactions",
          icon: ArrowLeftRight,
          path: "/transactions",
        },
        {
          name: "Expenses",
          icon: PieChart,
          path: "/expenses",
        },
        {
          name: "Investment Insights",
          icon: TrendingUp,
          path: "/investments",
        },
        {
          name: "Savings",
          icon: PiggyBank,
          path: "/budget",
        }
      ]
    },
    {
      name: "Profile",
      icon: User,
      isSubmenu: true,
      stateHandler: setOpenProfile,
      isOpen: openProfile,
      subItems: [
        {
          name: "Settings",
          icon: Settings,
          path: "/settings",
        },
        {
          name: "AI Assistant",
          icon: MessageSquare,
          path: "/assistant",
        }
      ]
    }
  ];

  // Use the hook directly
  const role = useUserRole();

  const renderMenuItem = (item) => {
    if (item.isSubmenu) {
      return (
        <div key={item.name} className="mb-1">
          <Collapsible
            open={item.isOpen}
            onOpenChange={item.stateHandler}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between"
              >
                <div className="flex items-center">
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </div>
                <div className={`transition-transform ${item.isOpen ? 'rotate-180' : ''}`}>
                  <ArrowDown className="h-4 w-4" />
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-8 pt-1">
              {item.subItems.map((subItem) => (
                <Button
                  key={subItem.name}
                  variant={location.pathname === subItem.path ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start mb-1",
                    location.pathname === subItem.path 
                      ? "bg-secondary text-white" 
                      : "hover:bg-secondary/10"
                  )}
                  onClick={() => navigate(subItem.path)}
                >
                  <subItem.icon className="mr-2 h-4 w-4" />
                  {subItem.name}
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    } else {
      return (
        <Button
          key={item.name}
          variant={location.pathname === item.path ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start mb-1",
            location.pathname === item.path 
              ? "bg-secondary text-white" 
              : "hover:bg-secondary/10"
          )}
          onClick={() => navigate(item.path)}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.name}
        </Button>
      );
    }
  };

  return (
    <div className="flex flex-col h-full pt-2">
      <div className="px-3 py-2 md:hidden">
        <div className="font-bold text-xl text-finance-purple mb-4">
          Wallet<span className="text-finance-blue">Master</span>
        </div>
      </div>
      
      <div className="px-3 py-2 flex-1 overflow-auto">
        <h2 className="mb-3 px-4 text-lg font-semibold tracking-tight">
          Navigation
        </h2>
        <div className="space-y-1">
          {mainMenuItems.map(renderMenuItem)}
          <Button
            key="profile"
            variant="ghost"
            className="w-full justify-start mb-1 hover:bg-secondary/10"
            onClick={() => window.location.href = "/profile"}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          {role === "admin" && (
            <Button
              key="admin"
              variant="ghost"
              className="w-full justify-start mb-1 hover:bg-secondary/10"
              onClick={() => window.location.href = "/admin"}
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin Panel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

