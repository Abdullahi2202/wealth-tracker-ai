
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Matches new table fields
type Registration = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  passport_number: string;
  image_url: string;
  created_at: string;
};

type Profile = {
  email: string;
  full_name: string | null;
};

type UserRole = "admin" | "user";

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, UserRole>>({});
  const [registrations, setRegistrations] = useState<Registration[]>([]);
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
      const userEmail = session.user.email;
      if (!userEmail) {
        toast.error("No user email.");
        navigate("/login");
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", userEmail)
        .maybeSingle();
      if (!data || data.role !== "admin") {
        toast.error("You must be an admin to access this page.");
        navigate("/");
      }
    };
    checkAdmin();
  }, [navigate]);

  // Fetch users, roles, and registrations
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: users, error: e1 } = await supabase.from("profiles").select("email, full_name");
      if (e1) {
        toast.error("Could not load users.");
        setLoading(false);
        return;
      }
      setProfiles(users || []);
      // Fetch all user roles
      const { data: allRoles, error: e2 } = await supabase.from("user_roles").select("email, role");
      if (!allRoles || e2) {
        setLoading(false);
        return;
      }
      const rolesMap: Record<string, UserRole> = {};
      for (const entry of allRoles) {
        rolesMap[entry.email] = entry.role;
      }
      setRoles(rolesMap);

      // Fetch registrations
      const { data: regs, error: e3 } = await supabase.from("registrations").select("*");
      if (!regs || e3) {
        setLoading(false);
        return;
      }
      setRegistrations(regs as Registration[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const setRole = async (email: string, role: UserRole) => {
    const { error } = await supabase.from("user_roles").upsert(
      [{ email, role }],
      { onConflict: "email,role" }
    );
    if (!error) {
      toast.success("Role updated!");
      setRoles((r) => ({ ...r, [email]: role }));
    } else {
      toast.error("Failed to update role.");
    }
  };

  // Helper to get registration by email
  const getReg = (profile_email: string) =>
    registrations.find((r) => r.email === profile_email);

  // Helper to get image public URL via API
  const getImageUrl = (image_path: string) =>
    supabase.storage.from("user-ids").getPublicUrl(image_path).data.publicUrl;

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardContent>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>View users & registrations</CardDescription>
          <div className="mt-6">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <table className="w-full border mt-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Phone</th>
                    <th className="text-left py-2 px-2">Passport #</th>
                    <th className="text-left py-2 px-2">ID Image</th>
                    <th className="text-left py-2 px-2">Role</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => {
                    const reg = getReg(profile.email);
                    return (
                      <tr key={profile.email} className="border-b">
                        <td className="px-2 py-2">{profile.email}</td>
                        <td className="px-2 py-2">{profile.full_name || "-"}</td>
                        <td className="px-2 py-2">
                          {reg ? reg.phone : <span className="text-muted-foreground italic">-</span>}
                        </td>
                        <td className="px-2 py-2">
                          {reg ? reg.passport_number : <span className="text-muted-foreground italic">-</span>}
                        </td>
                        <td className="px-2 py-2">
                          {reg && reg.image_url ? (
                            <a
                              href={getImageUrl(reg.image_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              View Image
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 capitalize">{roles[profile.email] || "user"}</td>
                        <td className="px-2 py-2 space-x-2">
                          <Button
                            variant={roles[profile.email] === "admin" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRole(profile.email, "admin")}
                          >
                            Make Admin
                          </Button>
                          <Button
                            variant={roles[profile.email] === "user" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRole(profile.email, "user")}
                            disabled={profile.email === roles[profile.email]}
                          >
                            Make User
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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

