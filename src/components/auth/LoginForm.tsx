
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardTitle, CardDescription, CardContent, Card } from "@/components/ui/card";
import { toast } from "sonner";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      // This is just a demo - in a real app, we would verify credentials
      const isDemo = email.includes("demo") || email.includes("test");
      
      if (isDemo && password.length > 3) {
        // Store fake login state
        localStorage.setItem("walletmaster_user", JSON.stringify({
          email,
          name: "Demo User",
          role: "user",
          loginTime: new Date().toISOString()
        }));
        
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials. Try demo@walletmaster.com with password 'demo123'");
      }
      
      setLoading(false);
    }, 1500);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg animate-fade-in">
      <CardContent className="pt-6">
        <CardTitle className="text-center text-2xl font-bold mb-2">
          Welcome to Wallet Master
        </CardTitle>
        <CardDescription className="text-center mb-6">
          Enter your credentials to access your account
        </CardDescription>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="demo@walletmaster.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          {/* Make Sign up a clear, obvious button for registration navigation */}
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={() => navigate("/register")}
            disabled={loading}
          >
            Sign up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;

