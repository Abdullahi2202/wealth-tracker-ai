
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import IdentityVerificationUpload from "./IdentityVerificationUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

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

  if (loading) {
    return <div className="text-center text-muted-foreground p-8">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <p>Unable to load profile data.</p>
        {!session && !user && (
          <p className="mt-2 text-sm">Please log in to view your profile.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Authentication Status */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Account Status</h3>
        <div className="text-sm space-y-1">
          <div>
            <span className="font-medium">Authentication: </span>
            <span className={session ? "text-green-600" : "text-orange-600"}>
              {session ? "Authenticated via Supabase" : "Using localStorage session"}
            </span>
          </div>
          {user && (
            <div>
              <span className="font-medium">User ID: </span>
              <span className="font-mono text-xs">{user.id}</span>
            </div>
          )}
          <div>
            <span className="font-medium">Email Verified: </span>
            <span className={user?.email_confirmed_at ? "text-green-600" : "text-orange-600"}>
              {user?.email_confirmed_at ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Photo, Name, Email */}
      <div className="flex justify-center items-center gap-6 flex-col md:flex-row md:items-start">
        <div className="flex flex-col items-center">
          <div className="relative h-32 w-32 rounded-full border-2 border-finance-purple bg-muted overflow-hidden mb-2">
            <div className="h-full w-full flex items-center justify-center text-4xl text-muted-foreground">
              {profile.full_name ? profile.full_name[0].toUpperCase() : "?"}
            </div>
          </div>
          <div className="text-lg font-bold">{profile.full_name || "Name not provided"}</div>
          <div className="text-xs text-muted-foreground">{profile.email}</div>
          {profile.id && (
            <div className="text-xs text-muted-foreground font-mono mt-1">
              ID: {profile.id.slice(0, 8)}...
            </div>
          )}
        </div>
        
        {/* Main profile details */}
        <div className="flex flex-col gap-3 min-w-[220px] w-full max-w-[330px]">
          <div>
            <span className="font-semibold mr-2">Phone:</span>
            <span>{profile.phone || <span className="italic text-muted-foreground">Not provided</span>}</span>
          </div>
          <div>
            <span className="font-semibold mr-2">Passport/License Number:</span>
            <span>{profile.passport_number || <span className="italic text-muted-foreground">Not provided</span>}</span>
          </div>
          <div>
            <span className="font-semibold mr-2">Profile Source:</span>
            <span className="text-sm text-muted-foreground">
              {profile.phone ? "Registration + Profile" : "Profile Only"}
            </span>
          </div>
        </div>
      </div>

      {/* Passport Section */}
      <div className="mt-6">
        <div className="font-bold mb-1">Passport Verification</div>
        {(() => {
          const req = findLatestReq("passport");
          if (req) {
            return (
              <div className="my-2">
                <div>
                  Status: <span className="capitalize font-semibold">{req.status}</span>
                  {req.status === "rejected" && req.feedback && (
                    <span className="ml-2 text-destructive text-xs">({req.feedback})</span>
                  )}
                </div>
                <div>
                  <a
                    href={getStorageUrl("identity-docs", req.new_document_url)}
                    target="_blank"
                    rel="noopener"
                    className="text-blue-600 underline"
                  >
                    View Uploaded Document
                  </a>
                </div>
              </div>
            );
          }
          return <IdentityVerificationUpload email={profile.email} documentType="passport" onSubmitted={() => fetchProfileData(profile.email)} />;
        })()}
      </div>

      {/* License Section */}
      <div>
        <div className="font-bold mb-1">Driver's License Verification</div>
        {(() => {
          const req = findLatestReq("license");
          if (req) {
            return (
              <div className="my-2">
                <div>
                  Status: <span className="capitalize font-semibold">{req.status}</span>
                  {req.status === "rejected" && req.feedback && (
                    <span className="ml-2 text-destructive text-xs">({req.feedback})</span>
                  )}
                </div>
                <div>
                  <a
                    href={getStorageUrl("identity-docs", req.new_document_url)}
                    target="_blank"
                    rel="noopener"
                    className="text-blue-600 underline"
                  >
                    View Uploaded Document
                  </a>
                </div>
              </div>
            );
          }
          return <IdentityVerificationUpload email={profile.email} documentType="license" onSubmitted={() => fetchProfileData(profile.email)} />;
        })()}
      </div>

      {/* Verification History */}
      <div>
        <div className="font-bold mb-1 mt-4">Verification History</div>
        <div className="space-y-1">
          {verificationRequests.length === 0 ? (
            <div className="text-muted-foreground text-sm">No verification actions submitted yet.</div>
          ) : (
            verificationRequests.map((r) => (
              <div key={r.id} className="border px-3 py-1 rounded text-xs flex flex-col md:flex-row md:items-center md:gap-4">
                <span>{r.document_type === "passport" ? "Passport" : "License"}: {r.status}</span>
                <span className="text-muted-foreground">Requested: {r.requested_at.slice(0, 10)}</span>
                {r.status !== "pending" && <span>Reviewed: {r.reviewed_at ? r.reviewed_at.slice(0, 10) : "-"}</span>}
                {r.feedback && <span className="text-destructive">Feedback: {r.feedback}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
