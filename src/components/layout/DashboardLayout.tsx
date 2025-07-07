
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "../dashboard/DashboardSidebar";
import MobileNavigation from "./MobileNavigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const user = localStorage.getItem("walletmaster_user");
    if (!user) {
      navigate("/");
    }

    // Enhanced mobile app setup
    const setupMobileApp = () => {
      // Prevent bounce effect on iOS
      document.body.style.overscrollBehavior = "none";
      // Fix TypeScript error by using type assertion
      (document.body.style as any).webkitOverflowScrolling = "touch";
      
      // Set viewport meta for better mobile display
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }

      // Add status bar class if in native app context
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        document.body.classList.add("capacitor-app");
        // Handle safe areas for notched devices
        document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
        document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      }
    };

    setupMobileApp();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col w-full bg-gray-50 overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 relative">
          {/* Sidebar on desktop only */}
          {!isMobile && (
            <aside className="hidden md:flex w-64 flex-col border-r bg-white shadow-sm">
              <DashboardSidebar />
            </aside>
          )}
          {/* Page content with mobile-optimized spacing */}
          <main className="flex-1 overflow-auto">
            <div className="h-full w-full">
              <div className="p-4 pb-20 md:p-6 md:pb-6 min-h-full">
                <div className="max-w-7xl mx-auto w-full">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
        {/* Mobile bottom nav - only show on mobile */}
        {isMobile && <MobileNavigation />}
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
