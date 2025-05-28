// Updated Login Component
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
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Login failed: " + error.message);
      setLoading(false);
      return;
    }

    // Check user role after successful login
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Login successful but session not found");
      setLoading(false);
      return;
    }

    // Fetch user role from database
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("email", session.user.email!)
      .single();

    // Store user data (without sensitive info)
    localStorage.setItem(
      "walletmaster_user",
      JSON.stringify({
        name: session.user.user_metadata?.full_name ?? "",
        email: session.user.email,
        role: roleData?.role || "user",
      })
    );

    toast.success("Logged in successfully!");

    // Redirect based on role
    if (roleData?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }

    setLoading(false);
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
      </CardContent>
    </Card>
  );
};

export default Login;