
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Database, Users, DollarSign, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newMetric, setNewMetric] = useState({
    metric_name: "",
    metric_value: 0,
    metric_type: "performance"
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching system metrics:', error);
        toast({
          title: "Error",
          description: "Failed to fetch system metrics",
          variant: "destructive",
        });
        return;
      }

      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMetric = async () => {
    if (!newMetric.metric_name || newMetric.metric_value === 0) {
      toast({
        title: "Error",
        description: "Metric name and value are required",
        variant: "destructive",
      });
      return;
    }

    setActionLoading('create');
    try {
      const { error } = await supabase
        .from('system_metrics')
        .insert({
          metric_name: newMetric.metric_name,
          metric_value: newMetric.metric_value,
          metric_type: newMetric.metric_type
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "System metric created successfully",
      });
      
      setNewMetric({ metric_name: "", metric_value: 0, metric_type: "performance" });
      setShowCreateModal(false);
      await fetchMetrics();
    } catch (error) {
      console.error('Error creating metric:', error);
      toast({
        title: "Error",
        description: "Failed to create metric",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to delete this metric?')) return;

    setActionLoading(`delete-${metricId}`);
    try {
      const { error } = await supabase
        .from('system_metrics')
        .delete()
        .eq('id', metricId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Metric deleted successfully",
      });
      
      await fetchMetrics();
    } catch (error) {
      console.error('Error deleting metric:', error);
      toast({
        title: "Error",
        description: "Failed to delete metric",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getMetricsByType = (type: string) => {
    return metrics.filter(m => m.metric_type === type);
  };

  const getAverageValue = (type: string) => {
    const typeMetrics = getMetricsByType(type);
    if (typeMetrics.length === 0) return 0;
    return typeMetrics.reduce((sum, m) => sum + Number(m.metric_value), 0) / typeMetrics.length;
  };

  const getTotalValue = (type: string) => {
    const typeMetrics = getMetricsByType(type);
    return typeMetrics.reduce((sum, m) => sum + Number(m.metric_value), 0);
  };

  const getMetricTypeColor = (type: string) => {
    switch (type) {
      case "performance": return "bg-blue-100 text-blue-800";
      case "usage": return "bg-green-100 text-green-800";
      case "error": return "bg-red-100 text-red-800";
      case "security": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading system metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMetricsByType('performance').length}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {getAverageValue('performance').toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Metrics</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMetricsByType('usage').length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {getTotalValue('usage').toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Metrics</CardTitle>
            <Database className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getMetricsByType('error').length}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {getAverageValue('error').toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Metrics</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMetricsByType('security').length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {getTotalValue('security').toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Metrics</h3>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Metric
        </Button>
      </div>

      {/* Metrics List */}
      <div className="grid gap-4">
        {metrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No system metrics found. Create your first metric to get started.
          </div>
        ) : (
          metrics.map((metric) => (
            <Card key={metric.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{metric.metric_name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getMetricTypeColor(metric.metric_type)}`}>
                      {metric.metric_type}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Value: {metric.metric_value} | Recorded: {new Date(metric.recorded_at).toLocaleString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMetric(metric.id)}
                  disabled={actionLoading === `delete-${metric.id}`}
                >
                  {actionLoading === `delete-${metric.id}` ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Metric Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add System Metric</DialogTitle>
            <DialogDescription>Create a new system metric for monitoring</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Metric Name</label>
              <Input
                value={newMetric.metric_name}
                onChange={(e) => setNewMetric(prev => ({ ...prev, metric_name: e.target.value }))}
                placeholder="e.g., CPU Usage, Memory Usage, Response Time"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Metric Value</label>
              <Input
                type="number"
                value={newMetric.metric_value}
                onChange={(e) => setNewMetric(prev => ({ ...prev, metric_value: Number(e.target.value) }))}
                placeholder="Enter metric value"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Metric Type</label>
              <Select value={newMetric.metric_type} onValueChange={(value) => setNewMetric(prev => ({ ...prev, metric_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={createMetric}
                disabled={actionLoading === 'create'}
              >
                {actionLoading === 'create' ? 'Creating...' : 'Create Metric'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemMetrics;
