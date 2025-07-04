import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Settings,
  Headphones,
  Activity,
  TrendingUp,
  AlertTriangle,
  FileText,
  UserX,
  Monitor,
  MessageSquare,
  Radar,
} from "lucide-react";

import { MainNav } from "@/components/main-nav";
import { Sidebar } from "@/components/sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { AppSettings } from "@/components/admin/AppSettings";
import { UserManagement } from "@/components/admin/UserManagement";
import { TransactionManagement } from "@/components/admin/TransactionManagement";
import { SupportTickets } from "@/components/admin/SupportTickets";
import { SystemMetrics } from "@/components/admin/SystemMetrics";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { FraudAlerts } from "@/components/admin/FraudAlerts";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { UserRestrictions } from "@/components/admin/UserRestrictions";
import { TransactionMonitoring } from "@/components/admin/TransactionMonitoring";
import { ChatbotLogs } from "@/components/admin/ChatbotLogs";
import { ActivityTracking } from "@/components/admin/ActivityTracking";
import EnhancedOverviewDashboard from "@/components/admin/EnhancedOverviewDashboard";

const AdminDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (!isMounted) {
    return null;
  }

  if (!session || session.user?.email !== "admin@example.com") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
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
      icon: Settings,
      label: "App Settings",
      value: "settings",
    },
    {
      icon: Headphones,
      label: "Support Tickets",
      value: "support",
    },
    {
      icon: TrendingUp,
      label: "System Metrics",
      value: "metrics",
    },
    {
      icon: Activity,
      label: "Activity Logs",
      value: "activity",
    },
    {
      icon: AlertTriangle,
      label: "Fraud Alerts",
      value: "fraud",
    },
    {
      icon: FileText,
      label: "Content Management",
      value: "content",
    },
    {
      icon: UserX,
      label: "User Restrictions",
      value: "restrictions",
    },
    {
      icon: Monitor,
      label: "Transaction Monitoring",
      value: "monitoring",
    },
    {
      icon: MessageSquare,
      label: "Chatbot Logs",
      value: "chatbot",
    },
    {
      icon: Radar,
      label: "Activity Tracking",
      value: "tracking",
    },
  ];

  return (
    <div className="h-full">
      <MainNav className="md:hidden" />
      <MobileSidebar routes={routes} onNavigate={setActiveSection} />
      <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0">
        <Sidebar routes={routes} onNavigate={setActiveSection} />
      </div>
      <div className="md:pl-64">
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "overview" && <EnhancedOverviewDashboard />}
          {activeSection === "users" && <UserManagement />}
          {activeSection === "transactions" && <TransactionManagement />}
          {activeSection === "settings" && <AppSettings />}
          {activeSection === "support" && <SupportTickets />}
          {activeSection === "metrics" && <SystemMetrics />}
          {activeSection === "activity" && <ActivityLogs />}
          {activeSection === "fraud" && <FraudAlerts />}
          {activeSection === "content" && <ContentManagement />}
          {activeSection === "restrictions" && <UserRestrictions />}
          {activeSection === "monitoring" && <TransactionMonitoring />}
          {activeSection === "chatbot" && <ChatbotLogs />}
          {activeSection === "tracking" && <ActivityTracking />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
