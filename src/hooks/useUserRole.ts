
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
        // Use the new get_user_role function to avoid recursion
        const { data: roleData, error } = await supabase
          .rpc('get_user_role', { user_uuid: session.user.id });

        if (error) {
          console.error("Error fetching role:", error);
          // Fallback: check if user is hardcoded admin
          if (session.user.email === "kingabdalla982@gmail.com") {
            setRole("admin");
          } else {
            setRole("user");
          }
          return;
        }

        const userRole = roleData;
        if (userRole === "admin") {
          setRole("admin");
        } else if (userRole === "user") {
          setRole("user");
        } else {
          // Default to user if no role found, or admin for hardcoded email
          if (session.user.email === "kingabdalla982@gmail.com") {
            setRole("admin");
          } else {
            setRole("user");
          }
        }
      } catch (error) {
        console.error("Error in fetchRole:", error);
        // Fallback: check if user is hardcoded admin
        const session_data = await supabase.auth.getSession();
        if (session_data.data.session?.user?.email === "kingabdalla982@gmail.com") {
          setRole("admin");
        } else {
          setRole("user");
        }
      }
    }
    fetchRole();
  }, []);

  return role;
}
