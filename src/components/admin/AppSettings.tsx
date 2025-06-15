
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Zap, Bell, Globe, Database } from "lucide-react";
import { toast } from "sonner";

interface AppSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: string;
  recorded_at: string;
}

const AppSettings = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch app settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .order('key', { ascending: true });

      setSettings(settingsData || []);

      // Fetch system metrics
      const { data: metricsData } = await supabase
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(10);

      setMetrics(metricsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) {
        toast.error('Failed to update setting');
        return;
      }

      toast.success('Setting updated successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const getSetting = (key: string, defaultValue: any = null) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">App Settings</h2>
        <p className="text-sm text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">App Name</label>
                  <Input
                    defaultValue={getSetting('app_name', 'WalletMaster')}
                    onBlur={(e) => updateSetting('app_name', e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">App Version</label>
                  <Input
                    defaultValue={getSetting('app_version', '1.0.0')}
                    onBlur={(e) => updateSetting('app_version', e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">App Description</label>
                <Textarea
                  defaultValue={getSetting('app_description', 'Digital wallet and payment management system')}
                  onBlur={(e) => updateSetting('app_description', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Enable to show maintenance page to users
                  </p>
                </div>
                <Switch
                  checked={getSetting('maintenance_mode', false)}
                  onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
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
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch
                  checked={getSetting('require_2fa', false)}
                  onCheckedChange={(checked) => updateSetting('require_2fa', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new users
                  </p>
                </div>
                <Switch
                  checked={getSetting('require_email_verification', true)}
                  onCheckedChange={(checked) => updateSetting('require_email_verification', checked)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Session Timeout (minutes)</label>
                <Input
                  type="number"
                  defaultValue={getSetting('session_timeout', 30)}
                  onBlur={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Maximum Login Attempts</label>
                <Input
                  type="number"
                  defaultValue={getSetting('max_login_attempts', 5)}
                  onBlur={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Default Currency</label>
                  <Input
                    defaultValue={getSetting('default_currency', 'USD')}
                    onBlur={(e) => updateSetting('default_currency', e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Transaction Fee (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={getSetting('transaction_fee', 2.5)}
                    onBlur={(e) => updateSetting('transaction_fee', parseFloat(e.target.value))}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Minimum Transaction Amount</label>
                  <Input
                    type="number"
                    defaultValue={getSetting('min_transaction_amount', 1)}
                    onBlur={(e) => updateSetting('min_transaction_amount', parseFloat(e.target.value))}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Maximum Transaction Amount</label>
                  <Input
                    type="number"
                    defaultValue={getSetting('max_transaction_amount', 10000)}
                    onBlur={(e) => updateSetting('max_transaction_amount', parseFloat(e.target.value))}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Crypto Payments</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to pay with cryptocurrencies
                  </p>
                </div>
                <Switch
                  checked={getSetting('enable_crypto', false)}
                  onCheckedChange={(checked) => updateSetting('enable_crypto', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for transactions
                  </p>
                </div>
                <Switch
                  checked={getSetting('email_notifications', true)}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Send SMS for important alerts
                  </p>
                </div>
                <Switch
                  checked={getSetting('sms_notifications', false)}
                  onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Send browser push notifications
                  </p>
                </div>
                <Switch
                  checked={getSetting('push_notifications', true)}
                  onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Admin Email</label>
                <Input
                  type="email"
                  defaultValue={getSetting('admin_email', 'admin@walletmaster.com')}
                  onBlur={(e) => updateSetting('admin_email', e.target.value)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Database Status</h4>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Storage Status</h4>
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Last Backup</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Environment</h4>
                  <Badge variant="outline">Production</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent System Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.length > 0 ? (
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{metric.metric_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {metric.metric_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{metric.metric_value}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(metric.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No system metrics recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppSettings;
