
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import ProfileView from "@/components/profile/ProfileView";
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted px-2">
        <Card className="max-w-2xl w-full rounded-2xl shadow-lg border border-gray-200 p-0">
          <CardContent className="p-8 pt-8 flex flex-col gap-6">
            <div className="text-center text-muted-foreground">
              Checking authentication...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted px-2">
      <Card className="max-w-2xl w-full rounded-2xl shadow-lg border border-gray-200 p-0">
        <CardContent className="p-8 pt-8 flex flex-col gap-6">
          <div className="flex flex-col items-center mb-2">
            <CardTitle className="text-2xl font-extrabold mb-1 text-center">
              My Profile
            </CardTitle>
          </div>
          <ProfileView />
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
