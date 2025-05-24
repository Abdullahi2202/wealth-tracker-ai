
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
      // Fix: Query by email (user_roles table)
      const result = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", session.user.email)
        .maybeSingle();
      const userRole = result.data?.role;
      if (userRole === "admin") setRole("admin");
      else if (userRole) setRole("user");
      else setRole(null);
    }
    fetchRole();
  }, []);

  return role;
}
