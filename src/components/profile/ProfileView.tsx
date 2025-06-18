
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Mail, CreditCard, FileText, CheckCircle, Clock, XCircle, ShieldCheck, Edit, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EditProfileForm from "./EditProfileForm";
import ProfileImageUpload from "./ProfileImageUpload";

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string;
  image_url?: string;
  passport_number?: string;
  document_type?: string;
  verification_status?: string;
}

interface WalletData {
  balance: number;
  currency: string;
}

export default function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Get current user from Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const userEmail = session?.user?.email;
      
      if (!userId || !userEmail) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Fetch registration data for verification status
      const { data: registrationData } = await supabase
        .from("registration")
        .select("*")
        .eq("email", userEmail)
        .maybeSingle();

      // Fetch wallet data
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance, currency")
        .eq("user_id", userId)
        .maybeSingle();

      // Combine profile data
      const combinedProfile: ProfileData = {
        id: userId,
        email: userEmail,
        full_name: profileData?.full_name || registrationData?.full_name,
        phone: profileData?.phone || registrationData?.phone,
        image_url: profileData?.image_url || registrationData?.image_url,
        passport_number: registrationData?.passport_number,
        document_type: registrationData?.document_type,
        verification_status: registrationData?.verification_status || 'unverified'
      };

      setProfile(combinedProfile);
      setWallet(walletData ? {
        balance: Number(walletData.balance) || 0,
        currency: walletData.currency || 'USD'
      } : null);

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    fetchProfileData(); // Refresh data
  };

  const handleImageUpdate = (newImageUrl: string) => {
    if (profile) {
      setProfile({ ...profile, image_url: newImageUrl });
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No profile data found.</p>
          <Button onClick={() => navigate("/register")} className="mt-4">
            Complete Registration
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <EditProfileForm
          profile={profile}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.image_url} alt={profile.full_name || "User"} />
                    <AvatarFallback className="text-xl">
                      {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-semibold">{profile.full_name || "User"}</h2>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Verification Status:</span>
                  {getStatusBadge(profile.verification_status)}
                </div>
                {wallet && (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${wallet.balance.toFixed(2)} {wallet.currency}</span>
                  </div>
                )}
              </div>
              {(profile.verification_status !== "verified") && (
                <div className="mt-4">
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
        </div>

        <div>
          <ProfileImageUpload
            userId={profile.id}
            currentImageUrl={profile.image_url}
            userName={profile.full_name || "User"}
            onImageUpdate={handleImageUpdate}
          />
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">{profile.phone || "Not provided"}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Full Name</p>
                  <p className="text-sm text-muted-foreground">{profile.full_name || "Not provided"}</p>
                </div>
              </div>
              {wallet && (
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Wallet Balance</p>
                    <p className="text-sm text-muted-foreground">${wallet.balance.toFixed(2)} {wallet.currency}</p>
                  </div>
                </div>
              )}
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
                <p className="text-sm font-medium mb-2">Document Image</p>
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
