
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import UserManagement from "@/components/admin/UserManagement";
import TransactionMonitoring from "@/components/admin/TransactionMonitoring";
import FraudAlerts from "@/components/admin/FraudAlerts";
import SupportTickets from "@/components/admin/SupportTickets";
import ChatbotLogs from "@/components/admin/ChatbotLogs";
import SystemMetrics from "@/components/admin/SystemMetrics";
import ActivityLogs from "@/components/admin/ActivityLogs";
import { Shield, Users, CreditCard, AlertTriangle, MessageSquare, BarChart3, FileText, Activity } from "lucide-react";

const AdminDashboard = () => {
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="text-center">
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="text-center">
          <p>Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Wallet Master Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Complete system administration and monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">Admin: {currentAdmin}</span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="fraud" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Fraud Alerts
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Support
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chatbot
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users, verification, and account status</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Monitoring</CardTitle>
              <CardDescription>Real-time transaction monitoring and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionMonitoring />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection & Alerts</CardTitle>
              <CardDescription>AI-powered fraud detection and risk management</CardDescription>
            </CardHeader>
            <CardContent>
              <FraudAlerts />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support Ticket Management</CardTitle>
              <CardDescription>Handle user support requests and disputes</CardDescription>
            </CardHeader>
            <CardContent>
              <SupportTickets />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot">
          <Card>
            <CardHeader>
              <CardTitle>AI Chatbot Analytics</CardTitle>
              <CardDescription>Monitor chatbot interactions and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatbotLogs />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics & Reports</CardTitle>
              <CardDescription>Platform analytics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <SystemMetrics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Logs</CardTitle>
              <CardDescription>Security audit trail and admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityLogs />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
