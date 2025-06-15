
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import IdentityVerificationUpload from "./IdentityVerificationUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import { Edit, Phone, Mail, CreditCard, Shield, CheckCircle, XCircle, Clock } from "lucide-react";

// Combined profile data from both profiles and registrations tables
type ProfileData = {
  email: string;
  full_name: string | null;
  phone?: string;
  passport_number?: string;
  id?: string;
};

type VerificationRequest = {
  id: string;
  document_type: "passport" | "license";
  new_document_url: string;
  new_number: string | null;
  status: "pending" | "approved" | "rejected";
  feedback: string | null;
  requested_at: string;
  reviewed_at: string | null;
  old_document_url: string | null;
};

export default function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile data when auth state changes
        if (session?.user) {
          fetchProfileData(session.user.email!);
        } else {
          // Check localStorage as fallback
          const storedUser = localStorage.getItem("walletmaster_user");
          if (storedUser) {
            try {
              const userObj = JSON.parse(storedUser);
              fetchProfileData(userObj.email);
            } catch (error) {
              console.error("Error parsing stored user:", error);
              setLoading(false);
            }
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfileData(session.user.email!);
      } else {
        // Check localStorage as fallback
        const storedUser = localStorage.getItem("walletmaster_user");
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            fetchProfileData(userObj.email);
          } catch (error) {
            console.error("Error parsing stored user:", error);
            setLoading(false);
          }
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfileData(userEmail: string) {
    setLoading(true);
    console.log("Fetching profile data for:", userEmail);

    try {
      // Fetch from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", userEmail)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      // Fetch from registrations table for additional data
      const { data: registrationData, error: registrationError } = await supabase
        .from("registrations")
        .select("email, full_name, phone, passport_number")
        .eq("email", userEmail)
        .maybeSingle();

      if (registrationError) {
        console.error("Error fetching registration:", registrationError);
      }

      // Combine data from both sources, prioritizing registration data for completeness
      const combinedProfile: ProfileData = {
        email: userEmail,
        full_name: registrationData?.full_name || profileData?.full_name || null,
        phone: registrationData?.phone || undefined,
        passport_number: registrationData?.passport_number || undefined,
        id: profileData?.id || undefined,
      };

      console.log("Combined profile data:", combinedProfile);
      setProfile(combinedProfile);

      // Fetch verification requests
      const { data: requests, error: requestsError } = await supabase
        .from("identity_verification_requests")
        .select("*")
        .eq("email", userEmail)
        .order("requested_at", { ascending: false });

      if (requestsError) {
        console.error("Error fetching verification requests:", requestsError);
      } else {
        // Cast document_type to expected types
        setVerificationRequests(
          (requests ?? []).map((r) => ({
            id: r.id,
            document_type: r.document_type === "passport" ? "passport" : "license",
            new_document_url: r.new_document_url,
            new_number: r.new_number,
            status: r.status === "pending" || r.status === "approved" || r.status === "rejected"
              ? r.status
              : "pending",
            feedback: r.feedback,
            requested_at: r.requested_at,
            reviewed_at: r.reviewed_at,
            old_document_url: r.old_document_url,
          }))
        );
      }
    } catch (error) {
      console.error("Error in fetchProfileData:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }

  function getStorageUrl(bucket: string, file: string) {
    return supabase.storage.from(bucket).getPublicUrl(file).data.publicUrl;
  }

  function findLatestReq(type: "passport" | "license") {
    return verificationRequests.find((r) => r.document_type === type && ["pending", "rejected"].includes(r.status));
  }

  function getVerificationStatus(type: "passport" | "license") {
    const req = verificationRequests.find((r) => r.document_type === type);
    if (!req) return null;
    return req.status;
  }

  function getStatusIcon(status: string | null) {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">Unable to load profile data.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
            {profile.full_name ? profile.full_name[0].toUpperCase() : "?"}
          </div>
          <Button 
            size="icon" 
            variant="outline" 
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {profile.full_name || "Add your name"}
        </h1>
        <p className="text-muted-foreground">{profile.email}</p>
      </div>

      {/* Profile Information Cards */}
      <div className="space-y-4">
        {/* Contact Information */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <span className="text-sm font-medium">{profile.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Phone</span>
              </div>
              <span className="text-sm font-medium">
                {profile.phone || <span className="text-gray-400">Not provided</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Identity Verification */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Identity Verification
          </h3>
          <div className="space-y-4">
            {/* Passport Verification */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-sm">Passport</p>
                  <p className="text-xs text-gray-500">Government issued ID</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(getVerificationStatus("passport"))}
                <span className="text-sm font-medium capitalize">
                  {getVerificationStatus("passport") || "Not verified"}
                </span>
              </div>
            </div>

            {/* Driver's License */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-sm">Driver's License</p>
                  <p className="text-xs text-gray-500">Valid driving license</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(getVerificationStatus("license"))}
                <span className="text-sm font-medium capitalize">
                  {getVerificationStatus("license") || "Not verified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Upload Sections */}
        {(() => {
          const passportReq = findLatestReq("passport");
          if (!passportReq) {
            return (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h4 className="font-medium mb-3">Upload Passport</h4>
                <IdentityVerificationUpload 
                  email={profile.email} 
                  documentType="passport" 
                  onSubmitted={() => fetchProfileData(profile.email)} 
                />
              </div>
            );
          }
          return null;
        })()}

        {(() => {
          const licenseReq = findLatestReq("license");
          if (!licenseReq) {
            return (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h4 className="font-medium mb-3">Upload Driver's License</h4>
                <IdentityVerificationUpload 
                  email={profile.email} 
                  documentType="license" 
                  onSubmitted={() => fetchProfileData(profile.email)} 
                />
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}
