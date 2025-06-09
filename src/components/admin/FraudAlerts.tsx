
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Shield, Eye, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type FraudAlert = {
  id: string;
  user_email: string;
  alert_type: string;
  risk_score: number;
  description: string;
  status: string;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  transaction_id: string | null;
};

const FraudAlerts = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fraud_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching fraud alerts:", error);
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const updateAlertStatus = async (alertId: string, status: string) => {
    const { error } = await supabase
      .from("fraud_alerts")
      .update({ 
        status, 
        reviewed_at: new Date().toISOString(),
        reviewed_by: "admin@walletmaster.com" // This should be the current admin
      })
      .eq("id", alertId);

    if (error) {
      toast.error("Failed to update alert status");
    } else {
      toast.success(`Alert marked as ${status}`);
      fetchAlerts();
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    statusFilter === "all" || alert.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "reviewed": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "false_positive": return "bg-gray-100 text-gray-800";
      default: return "bg-red-100 text-red-800";
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 90) return "text-red-600 font-bold";
    if (score >= 70) return "text-orange-600 font-semibold";
    if (score >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const calculateMetrics = () => {
    const highRiskAlerts = alerts.filter(a => a.risk_score >= 80).length;
    const pendingAlerts = alerts.filter(a => a.status === "pending").length;
    const resolvedAlerts = alerts.filter(a => a.status === "resolved").length;
    const falsePositives = alerts.filter(a => a.status === "false_positive").length;
    
    return { highRiskAlerts, pendingAlerts, resolvedAlerts, falsePositives };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return <div className="text-center py-8">Loading fraud alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.highRiskAlerts}</div>
            <p className="text-xs text-muted-foreground">Risk score ≥ 80</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Eye className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.pendingAlerts}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.resolvedAlerts}</div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positives</CardTitle>
            <Shield className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{metrics.falsePositives}</div>
            <p className="text-xs text-muted-foreground">Accuracy: {((metrics.resolvedAlerts / (metrics.resolvedAlerts + metrics.falsePositives)) * 100 || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fraud Alerts</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Alerts</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="false_positive">False Positive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Alert Type</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  {new Date(alert.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">{alert.user_email}</TableCell>
                <TableCell>{alert.alert_type}</TableCell>
                <TableCell>
                  <span className={getRiskColor(alert.risk_score)}>
                    {alert.risk_score}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs truncate">{alert.description}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {alert.status === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => updateAlertStatus(alert.id, "resolved")}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => updateAlertStatus(alert.id, "false_positive")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FraudAlerts;
