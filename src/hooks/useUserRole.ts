
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserRole() {
  const [role, setRole] = useState<null | "admin" | "user">(null);

  useEffect(() => {
    async function fetchRole() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setRole(null);
        return;
      }
      
      try {
        // First get user ID from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("email", session.user.email)
          .single();

        if (userError || !userData) {
          console.error("Error finding user:", userError);
          setRole(null);
          return;
        }

        // Then get role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.id)
          .single();

        if (roleError) {
          console.error("Error fetching role:", roleError);
          setRole(null);
          return;
        }

        const userRole = roleData?.role;
        if (userRole === "admin") setRole("admin");
        else if (userRole === "user") setRole("user");
        else setRole(null);
      } catch (error) {
        console.error("Error in fetchRole:", error);
        setRole(null);
      }
    }
    fetchRole();
  }, []);

  return role;
}
