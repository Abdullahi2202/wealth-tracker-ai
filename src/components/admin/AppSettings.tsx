
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Bell, DollarSign, Globe, Mail, Key } from "lucide-react";

const AppSettings = () => {
  const [settings, setSettings] = useState({
    // Security Settings
    twoFactorAuth: true,
    sessionTimeout: 30,
    passwordPolicy: "strong",
    
    // Payment Settings
    minimumTransferAmount: 1.00,
    maximumTransferAmount: 10000.00,
    transactionFee: 0.02,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    
    // System Settings
    maintenanceMode: false,
    newUserRegistrations: true,
    apiRateLimit: 1000,
    
    // Feature Flags
    investmentFeature: true,
    budgetingFeature: true,
    aiAssistant: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">App Settings</h2>
        <p className="text-sm text-muted-foreground">Configure system settings and preferences</p>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Two-Factor Authentication</label>
              <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(value) => handleSettingChange('twoFactorAuth', value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password Policy</label>
              <select
                value={settings.passwordPolicy}
                onChange={(e) => handleSettingChange('passwordPolicy', e.target.value)}
                className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
              >
                <option value="basic">Basic</option>
                <option value="strong">Strong</option>
                <option value="very-strong">Very Strong</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Transfer ($)</label>
              <Input
                type="number"
                step="0.01"
                value={settings.minimumTransferAmount}
                onChange={(e) => handleSettingChange('minimumTransferAmount', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Maximum Transfer ($)</label>
              <Input
                type="number"
                step="0.01"
                value={settings.maximumTransferAmount}
                onChange={(e) => handleSettingChange('maximumTransferAmount', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Transaction Fee (%)</label>
              <Input
                type="number"
                step="0.001"
                value={settings.transactionFee}
                onChange={(e) => handleSettingChange('transactionFee', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Email Notifications</label>
              <p className="text-sm text-muted-foreground">Send email notifications to users</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Push Notifications</label>
              <p className="text-sm text-muted-foreground">Send push notifications to mobile apps</p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(value) => handleSettingChange('pushNotifications', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">SMS Notifications</label>
              <p className="text-sm text-muted-foreground">Send SMS for critical alerts</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(value) => handleSettingChange('smsNotifications', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Maintenance Mode</label>
              <p className="text-sm text-muted-foreground">Disable app for maintenance</p>
            </div>
            <div className="flex items-center gap-2">
              {settings.maintenanceMode && <Badge variant="destructive">Active</Badge>}
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(value) => handleSettingChange('maintenanceMode', value)}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">New User Registrations</label>
              <p className="text-sm text-muted-foreground">Allow new users to register</p>
            </div>
            <Switch
              checked={settings.newUserRegistrations}
              onCheckedChange={(value) => handleSettingChange('newUserRegistrations', value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">API Rate Limit (requests/hour)</label>
            <Input
              type="number"
              value={settings.apiRateLimit}
              onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Investment Feature</label>
              <p className="text-sm text-muted-foreground">Enable investment tracking</p>
            </div>
            <Switch
              checked={settings.investmentFeature}
              onCheckedChange={(value) => handleSettingChange('investmentFeature', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Budgeting Feature</label>
              <p className="text-sm text-muted-foreground">Enable budget management</p>
            </div>
            <Switch
              checked={settings.budgetingFeature}
              onCheckedChange={(value) => handleSettingChange('budgetingFeature', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">AI Assistant</label>
              <p className="text-sm text-muted-foreground">Enable AI chatbot assistant</p>
            </div>
            <Switch
              checked={settings.aiAssistant}
              onCheckedChange={(value) => handleSettingChange('aiAssistant', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AppSettings;
