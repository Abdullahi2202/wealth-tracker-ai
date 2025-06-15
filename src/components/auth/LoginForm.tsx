
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

// Admin credentials (should ideally be in environment variables)
const ADMIN_EMAIL = "kingabdalla982@gmail.com";
const ADMIN_PASSWORD = "Ali@2202";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkUserRole = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('email', userEmail)
        .single();

      if (error) {
        console.error("Error checking user role:", error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  const checkUserVerification = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_verified')
        .eq('email', userEmail)
        .single();

      if (error) {
        console.error("Error checking user verification:", error);
        return false;
      }

      return data?.is_verified || false;
    } catch (error) {
      console.error("Error checking user verification:", error);
      return false;
    }
  };

  const handleAdminLogin = async () => {
    try {
      // For admin, create a session without going through Supabase auth
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Store admin session data directly
        localStorage.setItem(
          "walletmaster_user",
          JSON.stringify({
            email: ADMIN_EMAIL,
            role: "admin",
            isAdmin: true,
          })
        );

        // Try to ensure admin role exists in user_roles table (but don't fail if it doesn't work)
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert(
              { email: ADMIN_EMAIL, role: 'admin' },
              { onConflict: 'email' }
            );

          if (roleError) {
            console.error("Error setting admin role:", roleError);
            // Don't fail login if role setting fails - admin is already authenticated
          }
        } catch (roleSetError) {
          console.error("Role setting failed:", roleSetError);
          // Continue with login even if role setting fails
        }

        toast.success("Admin logged in successfully!");
        navigate("/admin-dashboard");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Admin login error:", error);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      // Special handling for admin login
      if (email === ADMIN_EMAIL) {
        const adminLoginSuccess = await handleAdminLogin();
        if (adminLoginSuccess) {
          setLoading(false);
          return;
        } else {
          toast.error("Invalid admin credentials.");
          setLoading(false);
          return;
        }
      }

      // Proceed with normal login for non-admin users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is verified (except for admin)
      const isVerified = await checkUserVerification(data.user.email!);
      
      if (!isVerified) {
        toast.error("Your account is not verified yet. Please wait for admin approval.");
        await supabase.auth.signOut(); // Sign them out immediately
        setLoading(false);
        return;
      }

      // Check user role after successful login
      const userRole = await checkUserRole(data.user.email!);
      
      // Store user data with role information
      localStorage.setItem(
        "walletmaster_user",
        JSON.stringify({
          email: data.user.email,
          role: userRole || "user",
          isAdmin: userRole === "admin",
        })
      );

      toast.success("Logged in successfully!");
      
      // Redirect based on user role
      if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg animate-fade-in">
      <CardContent className="pt-6">
        <CardTitle className="text-center text-2xl font-bold mb-2">
          Welcome to Wallet Master
        </CardTitle>
        <CardDescription className="text-center mb-6">
          Sign in to your account
        </CardDescription>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/register")}
            disabled={loading}
          >
            Register
          </Button>
        </form>

        {email === ADMIN_EMAIL && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Admin Login:</strong> Using predefined admin credentials.
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> New user accounts require admin verification before login access is granted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Login;
