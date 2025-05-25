
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted px-2">
      <Card className="max-w-md w-full rounded-2xl shadow-lg border border-gray-200 p-0">
        <CardContent className="p-8 pt-8 flex flex-col gap-6">
          <div className="flex flex-col items-center mb-2">
            <div className="bg-finance-purple/10 text-finance-purple w-16 h-16 rounded-full flex items-center justify-center mb-2">
              <User className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-extrabold mb-1 text-center">
              My Profile
            </CardTitle>
          </div>
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                handleUpdate();
              }}
              className="space-y-6 mt-2"
            >
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-base mb-0.5" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600"
                  value={profile.email}
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-base mb-0.5" htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, full_name: e.target.value }))
                  }
                  placeholder="Enter your name"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-finance-purple hover:bg-finance-purple/90 rounded-xl py-3 text-base font-semibold"
                disabled={loading}
              >
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
