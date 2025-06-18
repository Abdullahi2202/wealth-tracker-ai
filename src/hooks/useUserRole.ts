
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserRole() {
  const [role, setRole] = useState<null | "admin" | "user">(null);

  useEffect(() => {
    async function fetchRole() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setRole(null);
        return;
      }
      
      try {
        // Check if user is hardcoded admin
        if (session.user.email === "kingabdalla982@gmail.com") {
          setRole("admin");
          return;
        }

        // Check user roles table with proper error handling
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!error && roleData?.role === 'admin') {
          setRole("admin");
        } else {
          setRole("user");
        }
      } catch (error) {
        console.error("Error in fetchRole:", error);
        setRole("user");
      }
    }
    
    fetchRole();
  }, []);

  return role;
}
