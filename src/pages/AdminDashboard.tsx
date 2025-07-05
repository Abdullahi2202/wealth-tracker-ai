
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Headphones,
  Menu,
  X,
} from "lucide-react";

import UserManagement from "@/components/admin/UserManagement";
import TransactionManagement from "@/components/admin/TransactionManagement";
import SupportTickets from "@/components/admin/SupportTickets";
import EnhancedOverviewDashboard from "@/components/admin/EnhancedOverviewDashboard";

const AdminDashboard = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const routes = [
    {
      icon: LayoutDashboard,
      label: "Overview",
      value: "overview",
    },
    {
      icon: Users,
      label: "Users",
      value: "users",
    },
    {
      icon: ListChecks,
      label: "Transactions",
      value: "transactions",
    },
    {
      icon: Headphones,
      label: "Support Tickets",
      value: "support",
    },
  ];

  return (
    <div className="h-full">
      <div className="flex">
        {/* Header with WalletMaster toggle */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 text-xl font-bold hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="text-finance-purple">
              Wallet<span className="text-finance-blue">Master</span>
            </span>
          </button>
        </div>

        {/* Sidebar - only show when sidebarOpen is true */}
        {sidebarOpen && (
          <div className="fixed left-0 top-16 w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] overflow-y-auto z-40 shadow-lg">
            <div className="p-4">
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <nav className="mt-4">
              {routes.map((route) => {
                const Icon = route.icon;
                return (
                  <button
                    key={route.value}
                    onClick={() => {
                      setActiveSection(route.value);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 ${
                      activeSection === route.value ? "bg-blue-50 text-blue-600" : "text-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {route.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content - adjust margin based on sidebar */}
        <div className={`flex-1 overflow-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {activeSection === "overview" && <EnhancedOverviewDashboard />}
            {activeSection === "users" && <UserManagement />}
            {activeSection === "transactions" && <TransactionManagement />}
            {activeSection === "support" && <SupportTickets />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
