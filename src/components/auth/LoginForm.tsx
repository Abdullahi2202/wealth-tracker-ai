import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

// Remove legacy tables
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!email || !password) {
      toast.error("Please enter email and password.");
      setApiError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch user by email from registration table
      const { data: user, error } = await supabase
        .from("registration")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      console.log("Login user lookup", { user, error });

      if (error) {
        toast.error("Login error: " + error.message);
        setApiError("Login error: " + error.message);
        setLoading(false);
        return;
      }

      if (!user) {
        toast.error("No account found with this email.");
        setApiError("No account found with this email. Please register first.");
        setLoading(false);
        return;
      }

      // 2. Check password (plaintext for now, not secure)
      if (user.password !== password) {
        toast.error("Invalid email or password.");
        setApiError("Password is incorrect.");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "walletmaster_user",
        JSON.stringify({
          email: user.email,
          full_name: user.full_name,
          isAdmin: false,
          id: user.id,
        })
      );

      toast.success("Logged in successfully!");

      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Login failed, please try again.");
      setApiError("Login failed due to an unexpected error: " + (err?.message || JSON.stringify(err)));
      console.error("Unexpected login error:", err);
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
          {apiError && (
            <div className="bg-red-100 text-red-600 border border-red-300 p-2 rounded text-sm">
              {apiError}
            </div>
          )}
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
      </CardContent>
    </Card>
  );
};

export default Login;
