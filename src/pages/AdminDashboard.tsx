
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import UserManagement from "@/components/admin/UserManagement";
import SystemMetrics from "@/components/admin/SystemMetrics";
import OverviewDashboard from "@/components/admin/OverviewDashboard";
import TransactionManagement from "@/components/admin/TransactionManagement";
import ContentManagement from "@/components/admin/ContentManagement";
import AppSettings from "@/components/admin/AppSettings";
import ActivityTracking from "@/components/admin/ActivityTracking";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Shield, LogOut, Menu } from "lucide-react";

const AdminDashboard = () => {
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      console.log("Checking admin access...");
      
      // Check localStorage first for admin credentials
      const storedUser = localStorage.getItem("walletmaster_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          console.log("Stored user data:", userObj);
          
          if (userObj.isAdmin && userObj.email === "kingabdalla982@gmail.com") {
            console.log("Admin access granted from localStorage");
            setCurrentAdmin(userObj.email);
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("walletmaster_user");
        }
      }

      // Check if user is logged in via Supabase and has admin role
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("Checking Supabase user for admin role:", session.user.email);
        
        // Check if this is the admin email
        if (session.user.email === "kingabdalla982@gmail.com") {
          console.log("Admin user detected via Supabase");
          setCurrentAdmin(session.user.email);
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Check user roles table
        try {
          const { data: roleData, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
            
          if (!error && roleData?.role === 'admin') {
            console.log("Admin role found in database");
            setCurrentAdmin(session.user.email || 'admin');
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        } catch (roleError) {
          console.error("Error checking user role:", roleError);
        }
      }

      // No admin access found
      console.log("No admin access found, redirecting to login");
      toast.error("Admin privileges required");
      navigate("/login");
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    console.log("Admin logging out");
    localStorage.removeItem("walletmaster_user");
    
    // Also sign out from Supabase if logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut();
    }
    
    navigate("/login");
  };

  const handleWalletMasterClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-xl font-semibold text-slate-900">Overview Dashboard</CardTitle>
              <CardDescription className="text-slate-600">Platform statistics and analytics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <OverviewDashboard />
            </CardContent>
          </Card>
        );
      case "users":
        return (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-xl font-semibold text-slate-900">User Management</CardTitle>
              <CardDescription className="text-slate-600">Manage users, verification, and account status</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <UserManagement />
            </CardContent>
          </Card>
        );
      case "transactions":
        return (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-xl font-semibold text-slate-900">Transaction Management</CardTitle>
              <CardDescription className="text-slate-600">Monitor and manage all platform transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TransactionManagement />
            </CardContent>
          </Card>
        );
      case "content":
        return (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-xl font-semibold text-slate-900">Content Management</CardTitle>
              <CardDescription className="text-slate-600">Manage categories and app content</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ContentManagement />
            </CardContent>
          </Card>
        );
      case "settings":
        return (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-xl font-semibold text-slate-900">App Settings</CardTitle>
              <CardDescription className="text-slate-600">Configure system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <AppSettings />
            </CardContent>
          </Card>
        );
      case "activity":
        return (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-xl font-semibold text-slate-900">Activity Tracking</CardTitle>
              <CardDescription className="text-slate-600">Monitor user and admin activities</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ActivityTracking />
            </CardContent>
          </Card>
        );
      case "metrics":
        return (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-xl font-semibold text-slate-900">System Overview</CardTitle>
              <CardDescription className="text-slate-600">Platform analytics and key metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <SystemMetrics />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Only show sidebar when open */}
        {sidebarOpen && (
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        )}
        
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <button 
                      onClick={handleWalletMasterClick}
                      className="text-left hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <h1 className="text-2xl font-bold text-slate-900">
                        Wallet<span className="text-blue-600">Master</span>
                      </h1>
                      <p className="text-sm text-slate-600">Admin Dashboard</p>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">Welcome, {currentAdmin}</span>
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
