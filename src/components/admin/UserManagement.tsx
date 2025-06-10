
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Eye, UserCheck, UserX, AlertCircle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Profile = {
  email: string;
  full_name: string | null;
  id: string | null;
  created_at: string | null;
};

type Registration = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  passport_number: string;
  image_url: string;
  created_at: string;
};

type VerificationRequest = {
  id: string;
  email: string;
  document_type: string;
  status: string;
  requested_at: string;
  new_document_url?: string;
  new_number?: string;
};

const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();

    const verificationsChannel = supabase
      .channel('verifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'identity_verification_requests' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(verificationsChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const [profilesResult, registrationsResult, verificationsResult] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("registrations").select("*").order("created_at", { ascending: false }),
        supabase.from("identity_verification_requests").select("*").order("requested_at", { ascending: false })
      ]);

      if (profilesResult.error) {
        console.error("Error fetching profiles:", profilesResult.error);
        toast.error("Failed to fetch user profiles");
      } else {
        setProfiles(profilesResult.data || []);
      }

      if (registrationsResult.error) {
        console.error("Error fetching registrations:", registrationsResult.error);
        toast.error("Failed to fetch registrations");
      } else {
        setRegistrations(registrationsResult.data as Registration[] || []);
      }

      if (verificationsResult.error) {
        console.error("Error fetching verifications:", verificationsResult.error);
        toast.error("Failed to fetch verification requests");
      } else {
        setVerificationRequests(verificationsResult.data as VerificationRequest[] || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch user data");
    }
    
    setLoading(false);
  };

  const approveVerification = async (email: string) => {
    setProcessingAction(`approve-${email}`);
    try {
      console.log("Approving verification for:", email);
      
      const { error } = await supabase
        .from("identity_verification_requests")
        .update({ 
          status: "approved", 
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.email 
        })
        .eq("email", email)
        .eq("status", "pending");

      if (error) {
        console.error("Error approving verification:", error);
        toast.error("Failed to approve verification");
      } else {
        toast.success(`User ${email} verification approved successfully!`);
        await fetchData();
      }
    } catch (error) {
      console.error("Error approving verification:", error);
      toast.error("Failed to approve verification");
    }
    setProcessingAction(null);
  };

  const rejectVerification = async (email: string) => {
    setProcessingAction(`reject-${email}`);
    try {
      console.log("Rejecting verification for:", email);
      
      const { error } = await supabase
        .from("identity_verification_requests")
        .update({ 
          status: "rejected", 
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.email 
        })
        .eq("email", email)
        .eq("status", "pending");

      if (error) {
        console.error("Error rejecting verification:", error);
        toast.error("Failed to reject verification");
      } else {
        toast.success(`User ${email} verification rejected`);
        await fetchData();
      }
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast.error("Failed to reject verification");
    }
    setProcessingAction(null);
  };

  const createTestVerificationRequest = async () => {
    try {
      const testEmail = "test@example.com";
      const { error } = await supabase
        .from("identity_verification_requests")
        .insert({
          email: testEmail,
          document_type: "passport",
          status: "pending",
          new_document_url: "https://example.com/document.jpg",
          new_number: "A12345678"
        });

      if (error) {
        console.error("Error creating test verification:", error);
        toast.error("Failed to create test verification request");
      } else {
        toast.success("Test verification request created");
        await fetchData();
      }
    } catch (error) {
      console.error("Error creating test verification:", error);
      toast.error("Failed to create test verification request");
    }
  };

  const getRegistration = (email: string) => 
    registrations.find(r => r.email === email);

  const getVerificationStatus = (email: string) => {
    const verifications = verificationRequests.filter(v => v.email === email);
    if (verifications.length === 0) return "unverified";
    const latest = verifications.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())[0];
    return latest.status;
  };

  const getPendingVerifications = () => {
    return verificationRequests.filter(v => v.status === "pending");
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getVerificationStatus(profile.email);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <AlertCircle className="h-4 w-4" />;
      case "rejected": return <UserX className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading user data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage user verifications and account status</p>
        </div>
        <Button onClick={createTestVerificationRequest} variant="outline">
          Create Test Verification
        </Button>
      </div>

      {/* Pending Verifications Alert */}
      {getPendingVerifications().length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">
              {getPendingVerifications().length} Pending Verification{getPendingVerifications().length !== 1 ? 's' : ''}
            </h3>
          </div>
          <p className="text-yellow-700 mt-1">
            There are users waiting for verification approval. Please review and take action.
          </p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="approved">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Verification Status</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => {
              const registration = getRegistration(profile.email);
              const status = getVerificationStatus(profile.email);
              const isProcessing = processingAction?.includes(profile.email);
              
              return (
                <TableRow key={profile.email} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{profile.email}</TableCell>
                  <TableCell>{profile.full_name || registration?.full_name || "-"}</TableCell>
                  <TableCell>{registration?.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(status)} border flex items-center gap-1 w-fit`}>
                      {getStatusIcon(status)}
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.created_at 
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {/* View Details Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedUser(profile)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="font-medium text-sm text-gray-700">Email:</label>
                              <p className="text-gray-900">{profile.email}</p>
                            </div>
                            <div>
                              <label className="font-medium text-sm text-gray-700">Full Name:</label>
                              <p className="text-gray-900">{profile.full_name || registration?.full_name || "N/A"}</p>
                            </div>
                            <div>
                              <label className="font-medium text-sm text-gray-700">Phone:</label>
                              <p className="text-gray-900">{registration?.phone || "N/A"}</p>
                            </div>
                            <div>
                              <label className="font-medium text-sm text-gray-700">Passport Number:</label>
                              <p className="text-gray-900">{registration?.passport_number || "N/A"}</p>
                            </div>
                            <div>
                              <label className="font-medium text-sm text-gray-700">Status:</label>
                              <Badge className={`${getStatusColor(status)} border flex items-center gap-1 w-fit mt-1`}>
                                {getStatusIcon(status)}
                                {status}
                              </Badge>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Action Buttons for Pending Verifications */}
                      {status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-700 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300"
                            onClick={() => approveVerification(profile.email)}
                            disabled={isProcessing}
                          >
                            {processingAction === `approve-${profile.email}` ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
                            onClick={() => rejectVerification(profile.email)}
                            disabled={isProcessing}
                          >
                            {processingAction === `reject-${profile.email}` ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{profiles.length}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-700">
            {profiles.filter(p => getVerificationStatus(p.email) === "approved").length}
          </div>
          <div className="text-sm text-green-600">Verified Users</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-700">
            {profiles.filter(p => getVerificationStatus(p.email) === "pending").length}
          </div>
          <div className="text-sm text-yellow-600">Pending Verification</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-700">
            {profiles.filter(p => getVerificationStatus(p.email) === "rejected").length}
          </div>
          <div className="text-sm text-red-600">Rejected</div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
