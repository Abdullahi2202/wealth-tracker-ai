
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Eye, Edit, Trash2, Plus } from "lucide-react";

type AdminActivityLog = {
  id: string;
  admin_user_id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: unknown | null;
  user_agent: string | null;
  created_at: string;
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching admin activity logs:", error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return <Plus className="h-4 w-4" />;
    if (action.includes("update") || action.includes("edit")) return <Edit className="h-4 w-4" />;
    if (action.includes("delete") || action.includes("remove")) return <Trash2 className="h-4 w-4" />;
    if (action.includes("view") || action.includes("read")) return <Eye className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return "bg-green-100 text-green-800";
    if (action.includes("update") || action.includes("edit")) return "bg-blue-100 text-blue-800";
    if (action.includes("delete") || action.includes("remove")) return "bg-red-100 text-red-800";
    if (action.includes("view") || action.includes("read")) return "bg-gray-100 text-gray-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const calculateMetrics = () => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.created_at).toDateString() === today);
    const uniqueAdmins = [...new Set(logs.map(log => log.admin_user_id))].length;
    const criticalActions = logs.filter(log => 
      log.action.includes("delete") || log.action.includes("remove")
    ).length;
    return {
      totalLogs: logs.length,
      todayLogs: todayLogs.length,
      uniqueAdmins,
      criticalActions
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return <div className="text-center py-8">Loading activity logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLogs}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayLogs}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uniqueAdmins}</div>
            <p className="text-xs text-muted-foreground">Unique admin_user_id</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Actions</CardTitle>
            <Trash2 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalActions}</div>
            <p className="text-xs text-muted-foreground">Delete operations</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Admin Activity Logs</h3>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="view">View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Admin User ID</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.created_at).toLocaleDateString()} {' '}
                  {new Date(log.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-medium">{log.admin_user_id || "Unknown"}</TableCell>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>
                    <span className="flex items-center gap-1">
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.target_table && (
                    <div>
                      <div className="font-medium">{log.target_table}</div>
                      {log.target_id && (
                        <div className="text-xs text-muted-foreground">
                          ID: {String(log.target_id).substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {log.new_values && (
                    <div className="text-xs">
                      <div className="truncate">
                        New: {JSON.stringify(log.new_values).substring(0, 50)}...
                      </div>
                      {log.old_values && (
                        <div className="truncate text-muted-foreground">
                          Old: {JSON.stringify(log.old_values).substring(0, 50)}...
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.ip_address ? String(log.ip_address) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ActivityLogs;
