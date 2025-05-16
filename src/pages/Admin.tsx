
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type UserRole = "admin" | "user";

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, UserRole>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Please sign in to access admin panel.");
        navigate("/login");
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!data || data.role !== "admin") {
        toast.error("You must be an admin to access this page.");
        navigate("/");
      }
    };
    checkAdmin();
  }, [navigate]);

  // Fetch users & roles
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data: users, error: e1 } = await supabase.from("profiles").select("id, email, full_name");
      if (e1) {
        toast.error("Could not load users.");
        setLoading(false);
        return;
      }
      setProfiles(users || []);
      // Fetch all user roles
      const { data: allRoles, error: e2 } = await supabase.from("user_roles").select("user_id, role");
      if (!allRoles || e2) {
        setLoading(false);
        return;
      }
      const rolesMap: Record<string, UserRole> = {};
      for (const entry of allRoles) {
        rolesMap[entry.user_id] = entry.role;
      }
      setRoles(rolesMap);
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  const setRole = async (user_id: string, role: UserRole) => {
    // Upsert the role
    const { error } = await supabase.from("user_roles").upsert(
      [{ user_id, role }],
      { onConflict: "user_id,role" }
    );
    if (!error) {
      toast.success("Role updated!");
      setRoles((r) => ({ ...r, [user_id]: role }));
    } else {
      toast.error("Failed to update role.");
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardContent>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>View users & assign roles</CardDescription>
          <div className="mt-6">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <table className="w-full border mt-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Role</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-b">
                      <td className="px-2 py-2">{profile.email}</td>
                      <td className="px-2 py-2">{profile.full_name || "-"}</td>
                      <td className="px-2 py-2 capitalize">{roles[profile.id] || "user"}</td>
                      <td className="px-2 py-2 space-x-2">
                        <Button
                          variant={roles[profile.id] === "admin" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRole(profile.id, "admin")}
                        >
                          Make Admin
                        </Button>
                        <Button
                          variant={roles[profile.id] === "user" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRole(profile.id, "user")}
                          disabled={profile.id === roles[profile.id]}
                        >
                          Make User
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
