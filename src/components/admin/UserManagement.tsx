
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, RefreshCw, Plus, UserCheck, UserX, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VerificationRequest {
  id: string;
  document_type: string;
  document_number: string;
  image_url: string;
  status: string;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  user_email?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  passport_number?: string;
  image_url?: string;
  document_type?: string;
  verification_status?: string;
  created_at: string;
  is_active?: boolean;
  updated_at?: string;
  identity_verification_requests?: VerificationRequest[];
}

interface CreateUserData {
  email: string;
  full_name: string;
  phone?: string;
  passport_number?: string;
  document_type: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
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
    try {
      setLoading(true);
      console.log("Fetching users from user-management function...");
      
      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users: ' + error.message);
        setUsers([]);
      } else {
        console.log('Users fetched successfully:', data);
        setUsers(data || []);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to fetch users: ' + error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!createUserData.email || !createUserData.full_name) {
        toast.error('Email and full name are required');
        return;
      }

      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'POST',
        body: createUserData
      });

      if (error) {
        console.error('Error creating user:', error);
        toast.error('Failed to create user: ' + error.message);
        return;
      }

      toast.success('User created successfully');
      setShowCreateDialog(false);
      setCreateUserData({
        email: "",
        full_name: "",
        phone: "",
        passport_number: "",
        document_type: "passport"
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + error.message);
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (!selectedUser) return;

      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'PUT',
        body: {
          id: selectedUser.id,
          action: 'update',
          ...selectedUser
        }
      });

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Failed to update user: ' + error.message);
        return;
      }

      toast.success('User updated successfully');
      setShowEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user: ' + error.message);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'DELETE',
        body: { id: user.id, email: user.email }
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user: ' + error.message);
        return;
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user: ' + error.message);
    }
  };

  const handleVerificationStatus = async (user: User, status: 'verified' | 'pending' | 'rejected') => {
    try {
      console.log('Updating verification status for user:', user.id, 'to status:', status);
      
      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'PUT',
        body: {
          id: user.id,
          email: user.email,
          verification_status: status,
          action: 'update_verification'
        }
      });

      if (error) {
        console.error('Error updating verification status:', error);
        toast.error('Failed to update verification status: ' + error.message);
        return;
      }

      console.log('Successfully updated verification status:', data);
      toast.success(`User ${status} successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating verification status:', error);
      toast.error('Failed to update verification status: ' + error.message);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!createUserData.email || !createUserData.full_name) {
        toast.error('Email and full name are required');
        return;
      }

      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'POST',
        body: createUserData
      });

      if (error) {
        console.error('Error creating user:', error);
        toast.error('Failed to create user: ' + error.message);
        return;
      }

      toast.success('User created successfully');
      setShowCreateDialog(false);
      setCreateUserData({
        email: "",
        full_name: "",
        phone: "",
        passport_number: "",
        document_type: "passport"
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + error.message);
    }
  };

  const getStatusBadge = (user: User) => {
    const status = user.verification_status || 'pending';
    if (status === 'verified') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    } else if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const getLatestVerificationRequest = (user: User): VerificationRequest | null => {
    if (!user.identity_verification_requests || user.identity_verification_requests.length === 0) {
      return null;
    }
    
    return user.identity_verification_requests.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "verified" && user.verification_status === 'verified') ||
                         (statusFilter === "pending" && (user.verification_status === 'pending' || !user.verification_status)) ||
                         (statusFilter === "rejected" && user.verification_status === 'rejected');
    
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage users, verification, and account status</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the system</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    value={createUserData.email}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">Full Name</Label>
                  <Input
                    id="full_name"
                    value={createUserData.full_name}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input
                    id="phone"
                    value={createUserData.phone}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, phone: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="passport_number" className="text-right">Document ID</Label>
                  <Input
                    id="passport_number"
                    value={createUserData.passport_number}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, passport_number: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="document_type" className="text-right">Document Type</Label>
                  <Select value={createUserData.document_type} onValueChange={(value) => setCreateUserData(prev => ({ ...prev, document_type: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="license">Driver License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateUser}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-input bg-background px-3 py-2 text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.verification_status === 'verified').length}
            </div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter(u => u.verification_status === 'pending' || !u.verification_status).length}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.verification_status === 'rejected').length}
            </div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Verification Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const latestRequest = getLatestVerificationRequest(user);
                const canVerify = user.verification_status === 'pending' || !user.verification_status || user.verification_status === 'unverified';
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {user.phone && (
                          <div className="text-sm">{user.phone}</div>
                        )}
                        {(user.passport_number || latestRequest?.document_number) && (
                          <div className="text-sm text-muted-foreground">
                            ID: {user.passport_number || latestRequest?.document_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {latestRequest ? (
                          <>
                            <div className="capitalize">{latestRequest.document_type}</div>
                            <div className="text-muted-foreground">
                              Submitted: {format(new Date(latestRequest.created_at), 'MMM dd, yyyy')}
                            </div>
                            {latestRequest.image_url && (
                              <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedDocument(latestRequest.image_url)}
                                  className="h-6 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Document
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-muted-foreground">No document submitted</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {/* View Details Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>User Details - {user.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Personal Information</h4>
                                  <div className="text-sm space-y-1 mt-2">
                                    <div><strong>Name:</strong> {user.full_name}</div>
                                    <div><strong>Email:</strong> {user.email}</div>
                                    <div><strong>Phone:</strong> {user.phone || 'N/A'}</div>
                                    <div><strong>Status:</strong> {user.verification_status || 'pending'}</div>
                                    <div><strong>Created:</strong> {format(new Date(user.created_at), 'PPP')}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium">Verification Requests</h4>
                                  <div className="text-sm space-y-2 mt-2">
                                    {user.identity_verification_requests?.length ? (
                                      user.identity_verification_requests.map((request, index) => (
                                        <div key={request.id} className="border rounded p-2">
                                          <div><strong>Type:</strong> {request.document_type}</div>
                                          <div><strong>Number:</strong> {request.document_number}</div>
                                          <div><strong>Status:</strong> {request.status}</div>
                                          <div><strong>Submitted:</strong> {format(new Date(request.created_at), 'PPp')}</div>
                                          {request.reviewed_at && (
                                            <div><strong>Reviewed:</strong> {format(new Date(request.reviewed_at), 'PPp')}</div>
                                          )}
                                          {request.image_url && (
                                            <Button
                                              variant="link"
                                              size="sm"
                                              onClick={() => setSelectedDocument(request.image_url)}
                                              className="h-6 p-0 text-xs"
                                            >
                                              View Document
                                            </Button>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-muted-foreground">No verification requests</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Verification Action Buttons - Only show if user can be verified */}
                        {canVerify && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleVerificationStatus(user, 'verified')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Approve verification"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleVerificationStatus(user, 'rejected')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Reject verification"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {/* Edit Button */}
                        <Dialog open={showEditDialog && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setShowEditDialog(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit_email" className="text-right">Email</Label>
                                  <Input
                                    id="edit_email"
                                    value={selectedUser.email}
                                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit_name" className="text-right">Full Name</Label>
                                  <Input
                                    id="edit_name"
                                    value={selectedUser.full_name}
                                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit_phone" className="text-right">Phone</Label>
                                  <Input
                                    id="edit_phone"
                                    value={selectedUser.phone || ''}
                                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                    className="col-span-3"
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {setShowEditDialog(false); setSelectedUser(null);}}>Cancel</Button>
                              <Button onClick={handleUpdateUser}>Update User</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Delete Button */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found</p>
              <Button variant="outline" className="mt-2" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh to reload users
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Identity Document</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {selectedDocument && (
              <img
                src={selectedDocument}
                alt="Identity Document"
                className="max-w-full max-h-96 object-contain border rounded"
                onError={(e) => {
                  console.error('Error loading image:', selectedDocument);
                  toast.error('Failed to load document image');
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDocument(null)}>Close</Button>
            {selectedDocument && (
              <Button onClick={() => window.open(selectedDocument, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                value={createUserData.email}
                onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">Full Name</Label>
              <Input
                id="full_name"
                value={createUserData.full_name}
                onChange={(e) => setCreateUserData(prev => ({ ...prev, full_name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={createUserData.phone}
                onChange={(e) => setCreateUserData(prev => ({ ...prev, phone: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="passport_number" className="text-right">Document ID</Label>
              <Input
                id="passport_number"
                value={createUserData.passport_number}
                onChange={(e) => setCreateUserData(prev => ({ ...prev, passport_number: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document_type" className="text-right">Document Type</Label>
              <Select value={createUserData.document_type} onValueChange={(value) => setCreateUserData(prev => ({ ...prev, document_type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="license">Driver License</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
