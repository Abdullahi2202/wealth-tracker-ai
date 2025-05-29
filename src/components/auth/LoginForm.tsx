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

  const handleAdminAutoSetup = async () => {
    try {
      // 1. Sign up the admin user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (signUpError && !signUpError.message.includes('User already registered')) {
        throw signUpError;
      }

      // 2. Ensure admin role exists in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          { email: ADMIN_EMAIL, role: 'admin' },
          { onConflict: 'email' }
        );

      if (roleError) throw roleError;

      // 3. Manually confirm the email (bypass email confirmation)
      const { error: confirmError } = await supabase
        .from('auth.users')
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq('email', ADMIN_EMAIL);

      if (confirmError) throw confirmError;

      return true;
    } catch (error) {
      console.error("Admin auto-setup failed:", error);
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
        // First check if admin exists
        const { data: adminCheck, error: adminCheckError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('email', ADMIN_EMAIL)
          .single();

        // If admin doesn't exist, create automatically
        if (!adminCheck || adminCheckError) {
          const setupSuccess = await handleAdminAutoSetup();
          if (!setupSuccess) {
            toast.error("Admin setup failed. Please contact support.");
            setLoading(false);
            return;
          }
        }

        // Verify admin password
        if (password !== ADMIN_PASSWORD) {
          toast.error("Invalid admin password.");
          setLoading(false);
          return;
        }
      }

      // Proceed with normal login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: email === ADMIN_EMAIL ? ADMIN_PASSWORD : password,
      });

      if (error) throw error;

      // Store user data
      localStorage.setItem(
        "walletmaster_user",
        JSON.stringify({
          email: data.user.email,
          role: email === ADMIN_EMAIL ? "admin" : "user",
        })
      );

      toast.success("Logged in successfully!");
      navigate(email === ADMIN_EMAIL ? "/admin" : "/dashboard");

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
            disabled={loading || email === ADMIN_EMAIL}
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
      </CardContent>
    </Card>
  );
};

export default Login;