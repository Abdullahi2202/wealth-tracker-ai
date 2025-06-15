
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null); // reset error
    const { fullName, email, password, phone } = form;
    if (!fullName || !email || !password || !phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      // 1. Register with Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Only works in hosted environment, but here it's required
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (signUpError) {
        toast.error("Signup failed: " + signUpError.message);
        setApiError("Signup failed: " + signUpError.message);
        setLoading(false);
        return;
      }

      // 2. Add user profile to registration table
      const { error: dbError } = await supabase.from("registration").insert({
        email,
        password,
        full_name: fullName,
        phone,
        verification_status: "unverified",
      });
      if (dbError) {
        toast.error("Registration failed (database problem): " + dbError.message);
        setApiError("Registration failed (database problem): " + dbError.message);
        setLoading(false);
        return;
      }

      toast.success(
        "✅ Registration successful! Please check your email to verify. You can now log in.",
        {
          duration: 4200,
        }
      );
      setTimeout(() => navigate("/login"), 1800);
    } catch (err: any) {
      toast.error("Registration failed: " + (err?.message || JSON.stringify(err)));
      setApiError("Registration failed: " + (err?.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg p-4">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {apiError && (
            <div className="bg-red-100 text-red-600 border border-red-300 p-2 rounded text-sm">
              {apiError}
            </div>
          )}
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-4">
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
