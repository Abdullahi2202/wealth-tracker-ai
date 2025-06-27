
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lock, Unlock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserRestriction {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  restriction_type: 'send_only' | 'receive_only' | 'view_only' | 'blocked';
  reason: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

const UserRestrictions = () => {
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [restrictionType, setRestrictionType] = useState('');
  const [restrictionReason, setRestrictionReason] = useState('');

  useEffect(() => {
    fetchUserRestrictions();
  }, []);

  const fetchUserRestrictions = async () => {
    setLoading(true);
    try {
      // Mock data since we don't have a user_restrictions table yet
      const mockRestrictions: UserRestriction[] = [
        {
          id: '1',
          user_id: 'user1',
          user_email: 'restricted@example.com',
          user_name: 'Restricted User',
          restriction_type: 'send_only',
          reason: 'Suspicious activity detected',
          created_at: new Date().toISOString(),
          is_active: true
        }
      ];
      setRestrictions(mockRestrictions);
    } catch (error) {
      console.error('Error fetching user restrictions:', error);
      toast.error('Failed to fetch user restrictions');
    } finally {
      setLoading(false);
    }
  };

  const applyUserRestriction = async (userId: string, type: string, reason: string) => {
    try {
      // In a real implementation, this would update a user_restrictions table
      const newRestriction: UserRestriction = {
        id: Math.random().toString(),
        user_id: userId,
        user_email: selectedUser?.email || 'unknown@example.com',
        user_name: selectedUser?.full_name || 'Unknown User',
        restriction_type: type as any,
        reason,
        created_at: new Date().toISOString(),
        is_active: true
      };

      setRestrictions(prev => [...prev, newRestriction]);
      toast.success('User restriction applied successfully');
      setShowModal(false);
      setRestrictionReason('');
      setRestrictionType('');
    } catch (error) {
      console.error('Error applying restriction:', error);
      toast.error('Failed to apply restriction');
    }
  };

  const removeUserRestriction = async (restrictionId: string) => {
    try {
      setRestrictions(prev => prev.filter(r => r.id !== restrictionId));
      toast.success('User restriction removed successfully');
    } catch (error) {
      console.error('Error removing restriction:', error);
      toast.error('Failed to remove restriction');
    }
  };

  const getRestrictionColor = (type: string) => {
    switch (type) {
      case 'send_only': return 'bg-yellow-100 text-yellow-800';
      case 'receive_only': return 'bg-blue-100 text-blue-800';
      case 'view_only': return 'bg-orange-100 text-orange-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRestrictionIcon = (type: string) => {
    switch (type) {
      case 'blocked': return <Lock className="h-4 w-4" />;
      case 'view_only': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading user restrictions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">User Restrictions</h2>
          <p className="text-sm text-muted-foreground">
            Manage user access restrictions and permissions
          </p>
        </div>
      </div>

      {/* Restriction Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-yellow-100 text-yellow-800">Send Only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              User can only send money, not receive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-100 text-blue-800">Receive Only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              User can only receive money, not send
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-orange-100 text-orange-800">View Only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              User can only view transactions, no transfers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-red-100 text-red-800">Blocked</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              User is completely blocked from all actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Restrictions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active User Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Restriction Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restrictions.filter(r => r.is_active).map((restriction) => (
                  <TableRow key={restriction.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{restriction.user_name}</div>
                        <div className="text-sm text-muted-foreground">{restriction.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRestrictionIcon(restriction.restriction_type)}
                        <Badge className={getRestrictionColor(restriction.restriction_type)}>
                          {restriction.restriction_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate">{restriction.reason}</p>
                    </TableCell>
                    <TableCell>
                      {new Date(restriction.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeUserRestriction(restriction.id)}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {restrictions.filter(r => r.is_active).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No active user restrictions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply Restriction Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply User Restriction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Restriction Type</label>
              <Select value={restrictionType} onValueChange={setRestrictionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select restriction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_only">Send Only</SelectItem>
                  <SelectItem value="receive_only">Receive Only</SelectItem>
                  <SelectItem value="view_only">View Only</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={restrictionReason}
                onChange={(e) => setRestrictionReason(e.target.value)}
                placeholder="Enter reason for restriction..."
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => selectedUser && applyUserRestriction(
                  selectedUser.id, 
                  restrictionType, 
                  restrictionReason
                )}
                disabled={!restrictionType || !restrictionReason}
              >
                Apply Restriction
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowModal(false);
                  setRestrictionType('');
                  setRestrictionReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRestrictions;
