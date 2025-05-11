
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Bell, Moon, Sun, User, Shield, Wallet } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem("walletmaster_user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4 grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <Button size="sm" variant="outline" className="absolute bottom-0 right-0 rounded-full">
                    Edit
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Name</p>
                  <p className="text-base">John Doe</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Email</p>
                  <p className="text-base">john.doe@example.com</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Phone</p>
                  <p className="text-base">+1 (555) 123-4567</p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">Edit Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                App Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Switch between light and dark theme</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  <Moon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts about your account</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Currency</p>
                  <p className="text-sm text-muted-foreground">Set your preferred currency</p>
                </div>
                <Button variant="outline" size="sm">USD $</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Biometric Authentication</p>
                  <p className="text-sm text-muted-foreground">Use fingerprint or face ID to login</p>
                </div>
                <Switch checked={biometricAuth} onCheckedChange={setBiometricAuth} />
              </div>
              
              <div>
                <p className="font-medium mb-2">Password</p>
                <Button variant="outline" className="w-full">Change Password</Button>
              </div>
              
              <div>
                <p className="font-medium mb-2">Two-Factor Authentication</p>
                <Button variant="outline" className="w-full">Set Up 2FA</Button>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
