import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import IdentityVerificationUpload from "./IdentityVerificationUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Use only existing fields on the profiles table (no date_of_birth, no profile_photo_url)
type ProfileData = {
  email: string;
  full_name: string | null;
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
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);

  useEffect(() => {
    async function fetchProfileAndRequests() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const email = session.user.email;
      // Only get valid profile fields
      const { data: p } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("email", email)
        .maybeSingle();

      // p can be null or undefined
      setProfile(
        p && typeof p.email === "string"
          ? { email: p.email, full_name: p.full_name ?? null }
          : null
      );

      // Fetch verification requests
      const { data: requests } = await supabase
        .from("identity_verification_requests")
        .select("*")
        .eq("email", email)
        .order("requested_at", { ascending: false });

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
          email: r.email
        }))
      );
      setLoading(false);
    }
    fetchProfileAndRequests();
  }, []);

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
    return <div className="text-center text-muted-foreground">Unable to load profile data.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Photo, Name, Email */}
      <div className="flex justify-center items-center gap-6 flex-col md:flex-row md:items-start">
        <div className="flex flex-col items-center">
          <div className="relative h-32 w-32 rounded-full border-2 border-finance-purple bg-muted overflow-hidden mb-2">
            {/* No profile photo field; show initial */}
            <div className="h-full w-full flex items-center justify-center text-4xl text-muted-foreground">
              {profile.full_name ? profile.full_name[0] : "?"}
            </div>
          </div>
          <div className="text-lg font-bold">{profile.full_name || "-"}</div>
          <div className="text-xs text-muted-foreground">{profile.email}</div>
        </div>
        {/* Main profile details */}
        <div className="flex flex-col gap-3 min-w-[220px] w-full max-w-[330px]">
          {/* No date of birth field */}
          <div>
            <span className="font-semibold mr-2">Date of Birth:</span>
            <span className="italic text-muted-foreground">Not set</span>
          </div>
          <div>
            <span className="font-semibold mr-2">Passport Number:</span>
            <span>-</span>
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
          return <IdentityVerificationUpload email={profile.email} documentType="passport" onSubmitted={() => window.location.reload()} />;
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
          return <IdentityVerificationUpload email={profile.email} documentType="license" onSubmitted={() => window.location.reload()} />;
        })()}
      </div>
      {/* History or other requests */}
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
