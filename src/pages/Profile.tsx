
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import ProfileView from "@/components/profile/ProfileView";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const navigate = useNavigate();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // Check Supabase session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("User authenticated via Supabase:", session.user.email);
        setIsAuthChecked(true);
        return;
      }

      // Fallback to localStorage check
      const storedUser = localStorage.getItem("walletmaster_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          console.log("User found in localStorage:", userObj.email);
          setIsAuthChecked(true);
        } catch (error) {
          console.error("Error parsing stored user:", error);
          navigate("/login");
        }
      } else {
        console.log("No user session found, redirecting to login");
        navigate("/login");
      }
    }

    checkAuth();
  }, [navigate]);

  if (!isAuthChecked) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-muted-foreground">
              Checking authentication...
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <ProfileView />
      </div>
    </DashboardLayout>
  );
};

export default Profile;
