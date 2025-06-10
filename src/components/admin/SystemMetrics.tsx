
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, TrendingUp, Users, Activity, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('system-metrics-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'system_metrics' },
        (payload) => {
          console.log('New metric:', payload);
          setMetrics(prev => [payload.new as SystemMetric, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching system metrics:", error);
        toast.error("Failed to fetch system metrics");
      } else {
        setMetrics(data || []);
      }
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      toast.error("Failed to fetch system metrics");
    }
    setLoading(false);
  };

  const generateSampleMetrics = async () => {
    setRefreshing(true);
    try {
      const sampleMetrics = [
        { metric_name: "active_users_daily", metric_value: Math.floor(Math.random() * 2000) + 1000, metric_type: "user_metric" },
        { metric_name: "transactions_per_hour", metric_value: Math.floor(Math.random() * 100) + 20, metric_type: "transaction_metric" },
        { metric_name: "api_response_time_ms", metric_value: Math.floor(Math.random() * 200) + 50, metric_type: "performance_metric" },
        { metric_name: "fraud_detection_rate", metric_value: Math.floor(Math.random() * 10) + 90, metric_type: "security_metric" },
        { metric_name: "system_uptime_percent", metric_value: 99.5 + Math.random() * 0.5, metric_type: "system_metric" },
      ];

      for (const metric of sampleMetrics) {
        await supabase.from("system_metrics").insert(metric);
      }

      toast.success("Sample metrics generated");
      fetchMetrics();
    } catch (error) {
      console.error("Error generating metrics:", error);
      toast.error("Failed to generate metrics");
    }
    setRefreshing(false);
  };

  const getLatestMetrics = () => {
    const latestMetrics: { [key: string]: SystemMetric } = {};
    
    metrics.forEach(metric => {
      if (!latestMetrics[metric.metric_name] || 
          new Date(metric.recorded_at) > new Date(latestMetrics[metric.metric_name].recorded_at)) {
        latestMetrics[metric.metric_name] = metric;
      }
    });
    
    return Object.values(latestMetrics);
  };

  const getChartData = (metricName: string) => {
    return metrics
      .filter(m => m.metric_name === metricName)
      .slice(0, 10)
      .reverse()
      .map(m => ({
        time: new Date(m.recorded_at).toLocaleTimeString(),
        value: m.metric_value
      }));
  };

  const latestMetrics = getLatestMetrics();

  if (loading) {
    return <div className="text-center py-8">Loading system metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Performance Metrics</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={generateSampleMetrics}
            disabled={refreshing}
          >
            Generate Sample Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {latestMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.metric_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
              {metric.metric_type === "user_metric" && <Users className="h-4 w-4 text-muted-foreground" />}
              {metric.metric_type === "transaction_metric" && <Activity className="h-4 w-4 text-muted-foreground" />}
              {metric.metric_type === "performance_metric" && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
              {metric.metric_type === "security_metric" && <BarChart3 className="h-4 w-4 text-muted-foreground" />}
              {metric.metric_type === "system_metric" && <Activity className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.metric_name.includes('percent') || metric.metric_name.includes('rate') 
                  ? `${metric.metric_value.toFixed(1)}%`
                  : metric.metric_name.includes('time') 
                    ? `${metric.metric_value.toFixed(0)}ms`
                    : metric.metric_value.toFixed(0)
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(metric.recorded_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Users Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData("active_users_daily")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getChartData("api_response_time_ms")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData("transactions_per_hour")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData("system_uptime_percent")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[99, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#ff7300" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No metrics data available. Click "Generate Sample Data" to create some sample metrics.
        </div>
      )}
    </div>
  );
};

export default SystemMetrics;
