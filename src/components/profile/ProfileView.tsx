
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Phone, Mail, CreditCard, FileText, CheckCircle, Clock, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  email: string;
  full_name: string | null;
  phone?: string;
  passport_number?: string;
  image_url?: string;
  document_type?: string;
  verification_status?: string;
}

export default function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Get current user from Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;
      
      if (!userEmail) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Fetch from registration table using the authenticated user's email
      const { data: profileData } = await supabase
        .from("registration")
        .select("*")
        .eq("email", userEmail)
        .maybeSingle();

      if (!profileData) {
        // Try to fetch from profiles table as fallback
        const { data: authProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (authProfile) {
          setProfile({
            email: authProfile.email || userEmail,
            full_name: authProfile.full_name,
            phone: authProfile.phone,
            verification_status: 'unverified'
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
        return;
      }

      setProfile(profileData as ProfileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" /> Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
            <Clock className="h-4 w-4" /> Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
            <XCircle className="h-4 w-4" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Not Verified
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No profile data found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{profile.full_name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Verification Status:</span>
            {getStatusBadge(profile.verification_status)}
          </div>
          {(profile.verification_status !== "verified") && (
            <div className="mt-3">
              <Button
                variant="outline"
                className="border-blue-600 text-blue-700"
                onClick={() => navigate("/verify-identity")}
              >
                {profile.verification_status === "rejected" ? "Resubmit Identity" : "Verify Identity"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{profile.phone || "Not provided"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Document */}
      {profile.verification_status === "verified" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profile.document_type === "passport" ? (
                <FileText className="h-5 w-5" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              Verified Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Document Type</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {profile.document_type === "passport" ? "Passport" : "Driver's License"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {profile.document_type === "passport" ? "Passport Number" : "License Number"}
                </p>
                <p className="text-sm text-muted-foreground">{profile.passport_number}</p>
              </div>
            </div>
            {profile.image_url && (
              <div className="py-2">
                <p className="text-sm font-medium mb-1">Document Image</p>
                <img
                  src={profile.image_url}
                  alt="Document"
                  className="rounded-lg max-w-xs border border-gray-200"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
