
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminPermissions() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminPermissions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if user is hardcoded admin
        if (session.user.email === "kingabdalla982@gmail.com") {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Check user roles table
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (!error && roleData?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin permissions:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminPermissions();
  }, []);

  return { isAdmin, loading };
}
