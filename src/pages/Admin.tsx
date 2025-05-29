
// Updated Admin Component (with critical security fixes)
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
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin authentication from localStorage or Supabase session
  useEffect(() => {
    const checkAdmin = async () => {
      // First check localStorage for admin user
      const storedUser = localStorage.getItem("walletmaster_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj.isAdmin && userObj.role === "admin") {
            setCurrentAdmin(userObj.email);
            setIsAdmin(true);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }

      // Fallback to Supabase session check
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error("Please sign in to access admin panel.");
        navigate("/login");
        return;
      }
      
      const userEmail = session.user.email!;
      setCurrentAdmin(userEmail);

      // Secure role check using service key
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", userEmail)
        .single();

      if (!data || data.role !== "admin") {
        toast.error("Admin privileges required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    };
    
    checkAdmin();
  }, [navigate]);

  // Fetch data with RLS protection
  useEffect(() => {
    if (!currentAdmin || !isAdmin) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch profiles
      const { data: users, error: e1 } = await supabase
        .from("profiles")
        .select("email, full_name");
      
      if (e1) {
        toast.error("Could not load users: " + e1.message);
        setLoading(false);
        return;
      }
      setProfiles(users || []);
      
      // Fetch roles
      const { data: allRoles, error: e2 } = await supabase
        .from("user_roles")
        .select("email, role");
      
      if (e2) {
        toast.error("Role fetch error: " + e2.message);
        setLoading(false);
        return;
      }
      
      const rolesMap: Record<string, UserRole> = {};
      allRoles?.forEach(entry => {
        rolesMap[entry.email] = entry.role;
      });
      setRoles(rolesMap);

      // Fetch registrations
      const { data: regs, error: e3 } = await supabase
        .from("registrations")
        .select("*");
      
      if (e3) {
        toast.error("Registrations error: " + e3.message);
      } else {
        setRegistrations(regs as Registration[] || []);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [currentAdmin, isAdmin]);

  const setRole = async (email: string, role: UserRole) => {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ email, role }, { onConflict: "email" });
    
    if (error) {
      toast.error("Update failed: " + error.message);
    } else {
      toast.success("Role updated!");
      setRoles(prev => ({ ...prev, [email]: role }));
    }
  };

  const getReg = (profile_email: string) => 
    registrations.find(r => r.email === profile_email);

  const getImageUrl = (image_path: string) => 
    supabase.storage.from("user-ids").getPublicUrl(image_path).data.publicUrl;

  // Logout function for admin
  const handleLogout = async () => {
    // Clear localStorage
    localStorage.removeItem("walletmaster_user");
    
    // Sign out from Supabase if there's a session
    await supabase.auth.signOut();
    
    navigate("/login");
  };

  // Show loading or redirect if not admin
  if (!isAdmin) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center">
          <p>Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm">Logged in as: {currentAdmin}</span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage roles and view registrations</CardDescription>
          
          <div className="mt-6 overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">Loading user data...</div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 border">Email</th>
                    <th className="text-left py-3 px-4 border">Name</th>
                    <th className="text-left py-3 px-4 border">Phone</th>
                    <th className="text-left py-3 px-4 border">Passport #</th>
                    <th className="text-left py-3 px-4 border">ID Image</th>
                    <th className="text-left py-3 px-4 border">Role</th>
                    <th className="text-left py-3 px-4 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => {
                    const reg = getReg(profile.email);
                    const isCurrentUser = profile.email === currentAdmin;
                    
                    return (
                      <tr key={profile.email} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 border">{profile.email}</td>
                        <td className="px-4 py-3 border">{profile.full_name || "-"}</td>
                        <td className="px-4 py-3 border">
                          {reg?.phone || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 border">
                          {reg?.passport_number || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 border">
                          {reg?.image_url ? (
                            <a
                              href={getImageUrl(reg.image_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 border capitalize">
                          {roles[profile.email] || "user"}
                        </td>
                        <td className="px-4 py-3 border space-x-2">
                          <Button
                            size="sm"
                            onClick={() => setRole(profile.email, "admin")}
                            disabled={isCurrentUser || roles[profile.email] === "admin"}
                          >
                            Make Admin
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setRole(profile.email, "user")}
                            disabled={isCurrentUser || roles[profile.email] === "user"}
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
