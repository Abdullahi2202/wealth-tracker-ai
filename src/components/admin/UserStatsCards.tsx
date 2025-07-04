
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";
import { User } from "@/types/user";

interface UserStatsCardsProps {
  users: User[];
}

export const UserStatsCards = ({ users }: UserStatsCardsProps) => {
  const calculateStats = () => {
    const totalUsers = users.length;
    const verifiedUsers = users.filter(u => u.verification_status === "verified").length;
    const pendingUsers = users.filter(u => u.verification_status === "pending").length;
    const rejectedUsers = users.filter(u => u.verification_status === "rejected").length;
    
    return { totalUsers, verifiedUsers, pendingUsers, rejectedUsers };
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">Registered accounts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verified</CardTitle>
          <UserCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.verifiedUsers}</div>
          <p className="text-xs text-muted-foreground">Verified accounts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <UserX className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingUsers}</div>
          <p className="text-xs text-muted-foreground">Awaiting verification</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <UserX className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.rejectedUsers}</div>
          <p className="text-xs text-muted-foreground">Rejected accounts</p>
        </CardContent>
      </Card>
    </div>
  );
};
