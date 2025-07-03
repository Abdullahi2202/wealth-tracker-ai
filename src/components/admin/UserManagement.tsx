import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Search, Plus, Eye, Trash2, CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  verification_status: string;
  identity_verification_requests?: any[];
  documents?: Array<{
    type: string;
    number: string;
    image_url: string;
    status: string;
    created_at: string;
  }>;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    phone: "",
    passport_number: "",
    document_type: "passport"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users for admin...');
      
      const { data: response, error } = await supabase.functions.invoke('user-management', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching users via edge function:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }

      console.log('Users fetched successfully:', response?.length || 0);
      
      // Ensure all users have a verification_status, defaulting to 'pending' if not set
      const usersWithStatus = (response || []).map(user => ({
        ...user,
        verification_status: user.verification_status || 'pending'
      }));
      
      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserVerification = async (userId: string, status: string, userEmail: string) => {
    setActionLoading(`${userId}-${status}`);
    try {
      console.log('Updating user verification:', { userId, status, userEmail });
      
      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'PUT',
        body: {
          id: userId,
          email: userEmail,
          verification_status: status
        }
      });

      if (error) {
        console.error('Error updating user verification:', error);
        throw new Error(error.message || 'Failed to update verification status');
      }

      console.log('Verification update successful:', data);
      toast({
        title: "Success",
        description: `User ${status === 'verified' ? 'approved' : 'rejected'} successfully`,
      });
      
      // Update the user in the local state immediately
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, verification_status: status }
            : user
        )
      );
      
      // Also refresh the users list
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user verification status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.full_name) {
      toast({
        title: "Error",
        description: "Email and full name are required",
        variant: "destructive",
      });
      return;
    }

    setActionLoading('create-user');
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'POST',
        body: newUser
      });

      if (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      setShowCreateModal(false);
      setNewUser({
        email: "",
        full_name: "",
        phone: "",
        passport_number: "",
        document_type: "passport"
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(`delete-${userId}`);
    try {
      const { error } = await supabase.functions.invoke('user-management', {
        method: 'DELETE',
        body: { id: userId, email: userEmail }
      });

      if (error) {
        console.error('Error deleting user:', error);
        throw new Error(error.message || 'Failed to delete user');
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const viewDocument = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || user.verification_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateStats = () => {
    const totalUsers = users.length;
    const verifiedUsers = users.filter(u => u.verification_status === "verified").length;
    const pendingUsers = users.filter(u => u.verification_status === "pending").length;
    const rejectedUsers = users.filter(u => u.verification_status === "rejected").length;
    
    return { totalUsers, verifiedUsers, pendingUsers, rejectedUsers };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
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

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.phone && (
                    <div className="text-sm">{user.phone}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.verification_status)}>
                    {user.verification_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.documents && user.documents.length > 0 ? (
                    <div className="flex gap-1">
                      {user.documents.map((doc, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          onClick={() => viewDocument(doc.image_url)}
                          className="flex items-center gap-1"
                          title={`View ${doc.type} document`}
                        >
                          <FileText className="h-3 w-3" />
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No documents</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {/* Show approve/reject buttons for pending users */}
                    {user.verification_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50 border-green-200"
                          onClick={() => updateUserVerification(user.id, 'verified', user.email)}
                          disabled={actionLoading === `${user.id}-verified`}
                          title="Approve User"
                        >
                          {actionLoading === `${user.id}-verified` ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 border-red-200"
                          onClick={() => updateUserVerification(user.id, 'rejected', user.email)}
                          disabled={actionLoading === `${user.id}-rejected`}
                          title="Reject User"
                        >
                          {actionLoading === `${user.id}-rejected` ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                    
                    {/* Show status change buttons for verified/rejected users */}
                    {user.verification_status === 'verified' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 border-red-200"
                        onClick={() => updateUserVerification(user.id, 'rejected', user.email)}
                        disabled={actionLoading === `${user.id}-rejected`}
                        title="Reject User"
                      >
                        {actionLoading === `${user.id}-rejected` ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {user.verification_status === 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 border-green-200"
                        onClick={() => updateUserVerification(user.id, 'verified', user.email)}
                        disabled={actionLoading === `${user.id}-verified`}
                        title="Approve User"
                      >
                        {actionLoading === `${user.id}-verified` ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => deleteUser(user.id, user.email)}
                      disabled={actionLoading === `delete-${user.id}`}
                      title="Delete User"
                    >
                      {actionLoading === `delete-${user.id}` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No users found matching your criteria.
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <p>{selectedUser.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p>{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedUser.verification_status)}>
                    {selectedUser.verification_status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Joined</label>
                  <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <p className="font-mono text-sm">{selectedUser.id}</p>
                </div>
              </div>
              
              {/* Documents Section */}
              {selectedUser.documents && selectedUser.documents.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Documents</label>
                  <div className="space-y-2">
                    {selectedUser.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{doc.type.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-gray-600">Number: {doc.number}</p>
                          <p className="text-sm text-gray-500">
                            Submitted: {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDocument(doc.image_url)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          View Document
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick action buttons in modal */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedUser.verification_status === 'pending' && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        updateUserVerification(selectedUser.id, 'verified', selectedUser.email);
                        setShowDetailsModal(false);
                      }}
                      disabled={actionLoading === `${selectedUser.id}-verified`}
                    >
                      {actionLoading === `${selectedUser.id}-verified` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve User
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateUserVerification(selectedUser.id, 'rejected', selectedUser.email);
                        setShowDetailsModal(false);
                      }}
                      disabled={actionLoading === `${selectedUser.id}-rejected`}
                    >
                      {actionLoading === `${selectedUser.id}-rejected` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject User
                    </Button>
                  </>
                )}
                
                {selectedUser.verification_status === 'verified' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateUserVerification(selectedUser.id, 'rejected', selectedUser.email);
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading === `${selectedUser.id}-rejected`}
                  >
                    {actionLoading === `${selectedUser.id}-rejected` ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject User
                  </Button>
                )}
                
                {selectedUser.verification_status === 'rejected' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      updateUserVerification(selectedUser.id, 'verified', selectedUser.email);
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading === `${selectedUser.id}-verified`}
                  >
                    {actionLoading === `${selectedUser.id}-verified` ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve User
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone (Optional)</label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Passport Number (Optional)</label>
              <Input
                value={newUser.passport_number}
                onChange={(e) => setNewUser(prev => ({ ...prev, passport_number: e.target.value }))}
                placeholder="A12345678"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Document Type</label>
              <Select value={newUser.document_type} onValueChange={(value) => setNewUser(prev => ({ ...prev, document_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={createUser}
                disabled={!newUser.email || !newUser.full_name || actionLoading === 'create-user'}
              >
                {actionLoading === 'create-user' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : null}
                Create User
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({
                    email: "",
                    full_name: "",
                    phone: "",
                    passport_number: "",
                    document_type: "passport"
                  });
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

export default UserManagement;
