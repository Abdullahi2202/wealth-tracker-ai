
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("walletmaster_user");
    if (!user) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <aside className="hidden md:flex w-64 flex-col border-r bg-background">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      <MobileNavigation />
    </div>
  );
};

export default DashboardLayout;
