
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import UserManagement from "@/components/admin/UserManagement";
import TransactionMonitoring from "@/components/admin/TransactionMonitoring";
import FraudAlerts from "@/components/admin/FraudAlerts";
import SupportTickets from "@/components/admin/SupportTickets";
import ChatbotLogs from "@/components/admin/ChatbotLogs";
import SystemMetrics from "@/components/admin/SystemMetrics";
import ActivityLogs from "@/components/admin/ActivityLogs";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Shield, LogOut } from "lucide-react";

const AdminDashboard = () => {
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const storedUser = localStorage.getItem("walletmaster_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj.isAdmin && userObj.role === "admin") {
            setCurrentAdmin(userObj.email);
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error("Please sign in to access admin panel.");
        navigate("/login");
        return;
      }
      
      const userEmail = session.user.email!;
      setCurrentAdmin(userEmail);

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", userEmail)
        .single();

      if (!data || data.role !== "admin") {
        toast.error("Admin privileges required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };
    
    checkAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem("walletmaster_user");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl font-semibold">User Management</CardTitle>
              <CardDescription>Manage users, verification, and account status</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <UserManagement />
            </CardContent>
          </Card>
        );
      case "transactions":
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl font-semibold">Transaction Monitoring</CardTitle>
              <CardDescription>Real-time transaction monitoring and analysis</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TransactionMonitoring />
            </CardContent>
          </Card>
        );
      case "fraud":
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl font-semibold">Fraud Detection & Alerts</CardTitle>
              <CardDescription>AI-powered fraud detection and risk management</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <FraudAlerts />
            </CardContent>
          </Card>
        );
      case "support":
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl font-semibold">Support Ticket Management</CardTitle>
              <CardDescription>Handle user support requests and disputes</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <SupportTickets />
            </CardContent>
          </Card>
        );
      case "chatbot":
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl font-semibold">AI Chatbot Analytics</CardTitle>
              <CardDescription>Monitor chatbot interactions and performance</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ChatbotLogs />
            </CardContent>
          </Card>
        );
      case "metrics":
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl font-semibold">System Metrics & Reports</CardTitle>
              <CardDescription>Platform analytics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <SystemMetrics />
            </CardContent>
          </Card>
        );
      case "logs":
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl font-semibold">Admin Activity Logs</CardTitle>
              <CardDescription>Security audit trail and admin actions</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ActivityLogs />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-sm text-slate-600">Wallet Master Administration Panel</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{currentAdmin}</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
