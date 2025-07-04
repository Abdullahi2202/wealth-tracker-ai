
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, AlertTriangle, CheckCircle, Clock, UserCheck } from "lucide-react";

interface AdminQuickActionsProps {
  stats: {
    totalUsers: number;
    pendingUsers: number;
    pendingTransactions: number;
    totalTransactionValue: number;
  };
  onViewPendingUsers: () => void;
  onViewPendingTransactions: () => void;
}

export const AdminQuickActions = ({
  stats,
  onViewPendingUsers,
  onViewPendingTransactions
}: AdminQuickActionsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">Registered users</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-gray-50" onClick={onViewPendingUsers}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Users</CardTitle>
          <UserCheck className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingUsers}</div>
          <p className="text-xs text-muted-foreground">Need verification</p>
          {stats.pendingUsers > 0 && (
            <Badge variant="outline" className="mt-2 text-yellow-600">
              Action Required
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-gray-50" onClick={onViewPendingTransactions}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingTransactions}</div>
          <p className="text-xs text-muted-foreground">Over $100 transfers</p>
          {stats.pendingTransactions > 0 && (
            <Badge variant="outline" className="mt-2 text-orange-600">
              Review Required
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${stats.totalTransactionValue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Total processed</p>
        </CardContent>
      </Card>
    </div>
  );
};
