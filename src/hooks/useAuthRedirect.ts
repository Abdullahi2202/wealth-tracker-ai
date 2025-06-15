
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useAuthRedirect(
  redirectAuthenticatedTo: string = "/dashboard",
  redirectUnauthenticatedTo?: string
) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let redirecting = false;

    // Listener for auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session && !redirecting && redirectAuthenticatedTo) {
          redirecting = true;
          navigate(redirectAuthenticatedTo, { replace: true });
        }
        if (!session && !redirecting && redirectUnauthenticatedTo) {
          redirecting = true;
          navigate(redirectUnauthenticatedTo, { replace: true });
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && redirectAuthenticatedTo) {
        navigate(redirectAuthenticatedTo, { replace: true });
      }
      if (!session && redirectUnauthenticatedTo) {
        navigate(redirectUnauthenticatedTo, { replace: true });
      }
      setChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, redirectAuthenticatedTo, redirectUnauthenticatedTo]);

  return checking;
}
