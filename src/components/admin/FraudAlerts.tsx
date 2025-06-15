import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, Eye, Check, X, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type FraudAlert = {
  id: string;
  user_id: string;
  user_email?: string;
  alert_type: string;
  risk_score: number;
  description: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  transaction_id: string | null;
};

const FraudAlerts = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  useEffect(() => {
    fetchAlerts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('fraud-alerts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'fraud_alerts' },
        (payload) => {
          console.log('Fraud alert change:', payload);
          if (payload.eventType === 'INSERT') {
            setAlerts(prev => [payload.new as FraudAlert, ...prev]);
            toast.error("New fraud alert detected!");
          } else if (payload.eventType === 'UPDATE') {
            setAlerts(prev => prev.map(alert => 
              alert.id === payload.new.id ? payload.new as FraudAlert : alert
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fraud_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching fraud alerts:", error);
        toast.error("Failed to fetch fraud alerts");
      } else {
        setAlerts(data || []);
      }
    } catch (error) {
      console.error("Error fetching fraud alerts:", error);
      toast.error("Failed to fetch fraud alerts");
    }
    setLoading(false);
  };

  const updateAlertStatus = async (alertId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("fraud_alerts")
        .update({ 
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq("id", alertId);

      if (error) {
        console.error("Error updating alert status:", error);
        toast.error("Failed to update alert status");
      } else {
        toast.success(`Alert marked as ${status}`);
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error updating alert status:", error);
      toast.error("Failed to update alert status");
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-red-100 text-red-800";
      case "reviewed": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "false_positive": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return "text-red-600 font-bold";
    if (riskScore >= 60) return "text-orange-600 font-semibold";
    if (riskScore >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const calculateStats = () => {
    const pendingAlerts = alerts.filter(a => a.status === "pending").length;
    const highRiskAlerts = alerts.filter(a => a.risk_score >= 80).length;
    const avgRiskScore = alerts.length > 0 ? alerts.reduce((sum, a) => sum + a.risk_score, 0) / alerts.length : 0;
    
    return { pendingAlerts, highRiskAlerts, avgRiskScore };
  };

  const stats = calculateStats();

  if (loading) {
    return <div className="text-center py-8">Loading fraud alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">All fraud alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendingAlerts}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.highRiskAlerts}</div>
            <p className="text-xs text-muted-foreground">Risk score ≥ 80</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRiskScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Average risk level</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by email or alert type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="false_positive">False Positive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchAlerts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Alert Type</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  {new Date(alert.created_at).toLocaleDateString()} {" "}
                  {new Date(alert.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-medium">{alert.user_id || "Unknown"}</TableCell>
                <TableCell>{alert.alert_type}</TableCell>
                <TableCell>
                  <span className={getRiskColor(alert.risk_score)}>
                    {alert.risk_score}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Fraud Alert Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="font-medium">User:</label>
                            <p>{alert.user_id || "Unknown"}</p>
                          </div>
                          <div>
                            <label className="font-medium">Alert Type:</label>
                            <p>{alert.alert_type}</p>
                          </div>
                          <div>
                            <label className="font-medium">Risk Score:</label>
                            <p className={getRiskColor(alert.risk_score)}>{alert.risk_score}</p>
                          </div>
                          <div>
                            <label className="font-medium">Description:</label>
                            <p>{alert.description || "No description available"}</p>
                          </div>
                          <div>
                            <label className="font-medium">Status:</label>
                            <Badge className={getStatusColor(alert.status)}>
                              {alert.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {alert.reviewed_by && (
                            <div>
                              <label className="font-medium">Reviewed by:</label>
                              <p>{alert.reviewed_by}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {alert.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => updateAlertStatus(alert.id, "resolved")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => updateAlertStatus(alert.id, "false_positive")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAlerts.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No fraud alerts found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default FraudAlerts;
