import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Activity, User, CreditCard, Settings, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_table?: string;
  target_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

const ActivityTracking = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      // Type fix: convert ip_address to string if present
      setActivities((data || []).map((activity: any) => ({
        ...activity,
        ip_address: activity.ip_address !== undefined && activity.ip_address !== null
          ? String(activity.ip_address)
          : undefined
      })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      case 'update':
      case 'create':
      case 'delete':
        return <Settings className="h-4 w-4" />;
      case 'payment':
      case 'transaction':
        return <CreditCard className="h-4 w-4" />;
      case 'security':
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <Badge className="bg-green-100 text-green-800">Login</Badge>;
      case 'logout':
        return <Badge className="bg-gray-100 text-gray-800">Logout</Badge>;
      case 'create':
        return <Badge className="bg-blue-100 text-blue-800">Create</Badge>;
      case 'update':
        return <Badge className="bg-yellow-100 text-yellow-800">Update</Badge>;
      case 'delete':
        return <Badge className="bg-red-100 text-red-800">Delete</Badge>;
      case 'payment':
        return <Badge className="bg-purple-100 text-purple-800">Payment</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch =
      activity.admin_user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.target_table?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || activity.action?.toLowerCase() === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Activity Tracking</h2>
          <p className="text-sm text-muted-foreground">Monitor user and admin activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      {/* Search/filter UI */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-input bg-background px-3 py-2 text-sm rounded-md"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
        </CardContent>
      </Card>
      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredActivities.length}</div>
                <p className="text-sm text-muted-foreground">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredActivities.filter(a => a.action?.toLowerCase() === 'login').length}
                </div>
                <p className="text-sm text-muted-foreground">Logins Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredActivities.filter(a => ['create', 'update', 'delete'].includes(a.action?.toLowerCase() || '')).length}
                </div>
                <p className="text-sm text-muted-foreground">Admin Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Security Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    {/* Only show admin_user_id since users is gone */}
                    {activity.admin_user_id || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(activity.action)}
                      {getActionBadge(activity.action)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.target_table ? (
                      <div>
                        <div className="font-medium">{activity.target_table}</div>
                        {activity.target_id && (
                          <div className="text-sm text-muted-foreground font-mono">
                            {String(activity.target_id).slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {activity.ip_address || '-'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No activities found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTracking;
