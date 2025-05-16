
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
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data?.role === "admin") setRole("admin");
      else setRole("user");
    }
    fetchRole();
  }, []);

  return role;
}
