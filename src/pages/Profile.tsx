
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";

const Profile = () => {
  const [profile, setProfile] = useState<{ email: string; full_name: string }>({
    email: "",
    full_name: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Please log in first.");
        window.location.href = "/login";
        return;
      }
      const userEmail = session.user.email;
      if (!userEmail) {
        toast.error("No user email.");
        window.location.href = "/login";
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("email", userEmail)
        .maybeSingle();

      if (error || !data) {
        toast.error("Could not fetch profile info.");
        setLoading(false);
        return;
      }
      setProfile({
        email: data.email,
        full_name: data.full_name,
      });
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const userEmail = session.user.email;
    if (!userEmail) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, updated_at: new Date().toISOString() })
      .eq("email", userEmail);
    if (!error) {
      toast.success("Profile updated");
    } else {
      toast.error("Update failed");
    }
    setLoading(false);
  };

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardContent>
          <CardTitle>My Profile</CardTitle>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                handleUpdate();
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="font-semibold block mb-1">Email</label>
                <input
                  className="w-full px-2 py-2 bg-muted rounded border"
                  value={profile.email}
                  readOnly
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <input
                  className="w-full px-2 py-2 border rounded"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, full_name: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Save
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
