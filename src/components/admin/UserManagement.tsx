
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Eye, UserCheck, UserX, AlertCircle } from "lucide-react";
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
};

const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

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
    try {
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
        toast.success("User verification approved");
        fetchData();
      }
    } catch (error) {
      console.error("Error approving verification:", error);
      toast.error("Failed to approve verification");
    }
  };

  const rejectVerification = async (email: string) => {
    try {
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
        toast.success("User verification rejected");
        fetchData();
      }
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast.error("Failed to reject verification");
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

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getVerificationStatus(profile.email);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading user data...</div>;
  }

  return (
    <div className="space-y-6">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Verification Status</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => {
              const registration = getRegistration(profile.email);
              const status = getVerificationStatus(profile.email);
              
              return (
                <TableRow key={profile.email}>
                  <TableCell className="font-medium">{profile.email}</TableCell>
                  <TableCell>{profile.full_name || registration?.full_name || "-"}</TableCell>
                  <TableCell>{registration?.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(status)}>
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
                    <div className="flex gap-2">
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
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="font-medium">Email:</label>
                              <p>{profile.email}</p>
                            </div>
                            <div>
                              <label className="font-medium">Full Name:</label>
                              <p>{profile.full_name || registration?.full_name || "N/A"}</p>
                            </div>
                            <div>
                              <label className="font-medium">Phone:</label>
                              <p>{registration?.phone || "N/A"}</p>
                            </div>
                            <div>
                              <label className="font-medium">Passport Number:</label>
                              <p>{registration?.passport_number || "N/A"}</p>
                            </div>
                            <div>
                              <label className="font-medium">Status:</label>
                              <Badge className={getStatusColor(status)}>
                                {status}
                              </Badge>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:bg-green-50"
                            onClick={() => approveVerification(profile.email)}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => rejectVerification(profile.email)}
                          >
                            <UserX className="h-4 w-4" />
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{profiles.length}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {profiles.filter(p => getVerificationStatus(p.email) === "approved").length}
          </div>
          <div className="text-sm text-green-600">Verified Users</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {profiles.filter(p => getVerificationStatus(p.email) === "pending").length}
          </div>
          <div className="text-sm text-yellow-600">Pending Verification</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {profiles.filter(p => getVerificationStatus(p.email) === "rejected").length}
          </div>
          <div className="text-sm text-red-600">Rejected</div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
