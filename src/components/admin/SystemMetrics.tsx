
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Activity, DollarSign, Shield, Clock } from "lucide-react";

type SystemMetric = {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: string;
  recorded_at: string;
};

const SystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("system_metrics")
      .select("*")
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Error fetching system metrics:", error);
    } else {
      setMetrics(data || []);
    }
    setLoading(false);
  };

  const getMetricsByType = (type: string) => 
    metrics.filter(m => m.metric_type === type);

  const getLatestMetric = (name: string) => 
    metrics.find(m => m.metric_name === name)?.metric_value || 0;

  const userMetrics = getMetricsByType("user_metric");
  const transactionMetrics = getMetricsByType("transaction_metric");
  const performanceMetrics = getMetricsByType("performance_metric");
  const securityMetrics = getMetricsByType("security_metric");
  const systemMetrics = getMetricsByType("system_metric");

  // Chart data
  const chartData = [
    { name: 'Users', value: getLatestMetric('active_users_daily'), color: '#3b82f6' },
    { name: 'Transactions', value: getLatestMetric('transactions_per_hour'), color: '#10b981' },
    { name: 'Response Time', value: getLatestMetric('api_response_time_ms'), color: '#f59e0b' },
    { name: 'Uptime', value: getLatestMetric('system_uptime_percent'), color: '#8b5cf6' }
  ];

  const performanceData = [
    { time: '00:00', response_time: 120, uptime: 99.8 },
    { time: '04:00', response_time: 135, uptime: 99.9 },
    { time: '08:00', response_time: 110, uptime: 99.7 },
    { time: '12:00', response_time: 145, uptime: 99.8 },
    { time: '16:00', response_time: 125, uptime: 99.9 },
    { time: '20:00', response_time: 115, uptime: 99.8 }
  ];

  if (loading) {
    return <div className="text-center py-8">Loading system metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLatestMetric('active_users_daily')}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions/Hour</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLatestMetric('transactions_per_hour')}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLatestMetric('api_response_time_ms')}ms</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;200ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLatestMetric('system_uptime_percent')}%</div>
            <p className="text-xs text-muted-foreground">
              SLA: 99.9%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Detection Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLatestMetric('fraud_detection_rate')}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              AI-powered detection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="response_time" 
                  stroke="#3b82f6" 
                  name="Response Time (ms)"
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#10b981" 
                  name="Uptime (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['user_metric', 'transaction_metric', 'performance_metric', 'security_metric'].map(type => (
              <div key={type} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 capitalize">{type.replace('_', ' ')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getMetricsByType(type).slice(0, 3).map(metric => (
                    <div key={metric.id} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">{metric.metric_name.replace('_', ' ')}</div>
                      <div className="text-2xl font-bold">{metric.metric_value}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(metric.recorded_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMetrics;
