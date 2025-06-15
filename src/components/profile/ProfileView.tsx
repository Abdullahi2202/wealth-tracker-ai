
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Phone, Mail, CreditCard, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import IdentityVerificationUpload from "./IdentityVerificationUpload";

interface ProfileData {
  email: string;
  full_name: string | null;
  phone?: string;
  passport_number?: string;
  image_url?: string;
  document_type?: string;
  verification_status?: string;
}

interface RegistrationData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  passport_number: string;
  image_url: string;
  document_type: string;
  verification_status: string;
  created_at: string;
}

export default function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("unverified");
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to view your profile");
        return;
      }

      // Get profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email!)
        .single();

      // Get registration data with new columns
      const { data: registrationData } = await supabase
        .from("registrations")
        .select("*")
        .eq("email", user.email!)
        .single();

      // Get verification status
      const { data: verificationData } = await supabase
        .from("identity_verification_requests")
        .select("status")
        .eq("email", user.email!)
        .order("requested_at", { ascending: false })
        .limit(1);

      const combinedProfile: ProfileData = {
        email: user.email!,
        full_name: profileData?.full_name || registrationData?.full_name,
        phone: registrationData?.phone,
        passport_number: registrationData?.passport_number,
        image_url: registrationData?.image_url,
        document_type: registrationData?.document_type || "passport",
        verification_status: registrationData?.verification_status || "unverified"
      };

      setProfile(combinedProfile);
      
      if (verificationData && verificationData.length > 0) {
        setVerificationStatus(verificationData[0].status);
      } else {
        setVerificationStatus(registrationData?.verification_status || "unverified");
      }

    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

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
      case "pending": return <Clock className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getDocumentUrl = (imagePath: string) => {
    if (!imagePath) return null;
    const { data } = supabase.storage.from('identity-docs').getPublicUrl(imagePath);
    return data.publicUrl;
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Verification Status:</span>
            <Badge className={`${getStatusColor(verificationStatus)} border flex items-center gap-1`}>
              {getStatusIcon(verificationStatus)}
              {verificationStatus}
            </Badge>
          </div>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {profile.document_type === "passport" ? (
              <FileText className="h-5 w-5" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            Identity Document
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
              <p className="text-sm font-medium">Document Number</p>
              <p className="text-sm text-muted-foreground">{profile.passport_number || "Not provided"}</p>
            </div>
          </div>

          {profile.image_url && verificationStatus === "approved" && (
            <div>
              <p className="text-sm font-medium mb-2">Document Image</p>
              <img
                src={getDocumentUrl(profile.image_url)}
                alt="Identity Document"
                className="max-w-md rounded-lg border shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {verificationStatus === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-2">
                Your verification was rejected. You can upload a new document for re-verification.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowUpload(!showUpload)}
              >
                Upload New Document
              </Button>
              {showUpload && (
                <div className="mt-4">
                  <IdentityVerificationUpload
                    email={profile.email}
                    documentType={profile.document_type as "passport" | "license"}
                    onSubmitted={() => {
                      setShowUpload(false);
                      fetchProfileData();
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {verificationStatus === "pending" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Your verification is pending review. You'll receive an email notification once it's processed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
