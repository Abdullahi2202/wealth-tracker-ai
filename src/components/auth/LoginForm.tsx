
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

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
      console.log("Attempting login for:", email);
      
      // Check if this is the hardcoded admin
      if (email === "kingabdalla982@gmail.com" && password === "Ali@2202") {
        console.log("Admin login detected, storing admin data in localStorage");
        
        // Store admin info in localStorage for admin dashboard access
        localStorage.setItem("walletmaster_user", JSON.stringify({
          email: email,
          isAdmin: true,
          fullName: "Admin User"
        }));
        
        toast.success("Admin logged in successfully!");
        navigate("/admin");
        return;
      }
      
      // Regular Supabase Auth login for other users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        console.error("Supabase login error:", error);
        toast.error("Login error: " + (error?.message ?? "Could not log in."));
        setApiError("Login error: " + (error?.message ?? "Could not log in."));
        return;
      }

      console.log("Regular user login successful:", data.user?.email);
      toast.success("Logged in successfully!");
      navigate("/dashboard");
      
    } catch (err: any) {
      console.error("Login exception:", err);
      toast.error("Login failed, please try again.");
      setApiError("Login failed due to an unexpected error: " + (err?.message || JSON.stringify(err)));
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
