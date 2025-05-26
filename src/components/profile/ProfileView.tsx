
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import IdentityVerificationUpload from "./IdentityVerificationUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProfileData = {
  email: string;
  full_name: string | null;
  passport_number: string | null;
  date_of_birth: string | null;
  profile_photo_url: string | null;
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

  // Fetch user info and verifications
  useEffect(() => {
    async function fetchProfileAndRequests() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;
      const email = session.user.email;
      // Fetch profile
      const { data: p } = await supabase
        .from("profiles")
        .select("email, full_name, date_of_birth, profile_photo_url")
        .eq("email", email)
        .maybeSingle();
      setProfile(p);
      // Fetch verification requests (show history and current)
      const { data: requests } = await supabase
        .from("identity_verification_requests")
        .select("*")
        .eq("email", email)
        .order("requested_at", { ascending: false });
      setVerificationRequests(requests ?? []);
      setLoading(false);
    }
    fetchProfileAndRequests();
  }, []);

  async function uploadProfilePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoUploading(true);
    const path = `${profile.email}/profile-photo-${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (uploadErr) {
      toast.error("Profile photo upload failed");
      setProfilePhotoUploading(false);
      return;
    }
    // Set the url in profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ profile_photo_url: path })
      .eq("email", profile.email);
    setProfilePhotoUploading(false);
    if (!updateErr) {
      toast.success("Profile photo updated!");
      setProfile({ ...profile, profile_photo_url: path });
    } else {
      toast.error("Failed to update profile photo");
    }
  }

  function getStorageUrl(bucket: string, file: string) {
    return supabase.storage.from(bucket).getPublicUrl(file).data.publicUrl;
  }

  // Find most recent pending/rejected request per document type
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
            {profile.profile_photo_url ? (
              // Allow user to see photo
              <img
                src={getStorageUrl("profile-photos", profile.profile_photo_url)}
                alt="Profile"
                className="object-cover h-full w-full"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-4xl text-muted-foreground">?</div>
            )}
            <label className="absolute bottom-0 w-full bg-black/60 text-white text-xs px-2 py-1 text-center cursor-pointer hover:bg-black/80 transition-all">
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={uploadProfilePhoto}
                disabled={profilePhotoUploading}
              />
              {profilePhotoUploading ? "Uploading..." : "Change Photo"}
            </label>
          </div>
          <div className="text-lg font-bold">{profile.full_name || "-"}</div>
          <div className="text-xs text-muted-foreground">{profile.email}</div>
        </div>
        {/* Main profile details */}
        <div className="flex flex-col gap-3 min-w-[220px] w-full max-w-[330px]">
          <div>
            <span className="font-semibold mr-2">Date of Birth:</span>
            {profile.date_of_birth ? (
              <span>{profile.date_of_birth}</span>
            ) : <span className="italic text-muted-foreground">Not set</span>}
          </div>
          <div>
            <span className="font-semibold mr-2">Passport Number:</span>
            {/* Display the verified one only */}
            <span>-</span>
          </div>
          {/* Option: show current status and number, or let user request change */}
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
          // If no pending, allow upload
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
