import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "../dashboard/DashboardSidebar";
import MobileNavigation from "./MobileNavigation";
import { SidebarProvider } from "@/components/ui/sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("walletmaster_user");
    if (!user) {
      navigate("/");
    }

    // Add additional setup for mobile app if needed
    const setupMobileApp = () => {
      // Prevent bounce effect on iOS
      document.body.style.overscrollBehavior = "none";

      // Add status bar class if in native app context
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        document.body.classList.add("capacitor-app");
      }
    };

    setupMobileApp();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col w-full bg-gray-50">
        <DashboardHeader />
        <div className="flex flex-1">
          {/* Sidebar on desktop */}
          <aside className="hidden md:flex w-64 flex-col border-r bg-white shadow-sm">
            <DashboardSidebar />
          </aside>
          {/* Page content with proper mobile spacing */}
          <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        {/* Mobile bottom nav */}
        <MobileNavigation />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
