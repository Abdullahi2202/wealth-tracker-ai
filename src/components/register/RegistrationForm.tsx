import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import DocumentUpload from "./DocumentUpload";

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

  // Helper for detailed error display
  const getErrorMessage = (err: any) => {
    if (!err) return "Unknown registration error. Please contact support.";
    if (typeof err === "string") return err;
    if (err?.message) return err.message;
    if (err?.error_description) return err.error_description;
    return JSON.stringify(err);
  };

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
      // 1. Check for duplicates
      const { data: exist, error: checkError } = await supabase
        .from("registration")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      console.log("Exist check", { exist, checkError });

      if (exist) {
        toast.error("This email is already registered. Please log in instead.");
        navigate("/login");
        setLoading(false);
        return;
      }
      // 2. Insert user (no document info)
      const { data: inserted, error } = await supabase.from("registration").insert({
        email,
        password,
        full_name: fullName,
        phone,
        verification_status: "unverified",
      })
      .select("*")
      .single();

      console.log("Insert result", { inserted, error });

      if (error || !inserted) {
        // Changed this to reveal raw error+code from supabase
        const message =
          error
            ? `Registration failed [${error.code ?? ""}]: ${error.message ?? error}`
            : "Registration failed: Could not insert user.";
        toast.error(message);
        setApiError(message);
        setLoading(false);
        return;
      }

      toast.success(
        "✅ Registration successful! Please check your email for next steps. You can now log in.",
        {
          description: (
            <div>
              <div className="text-muted-foreground">Thank you, {fullName}!</div>
              <div className="text-xs">You’ll be redirected shortly.</div>
            </div>
          ),
          duration: 4200,
        }
      );
      setTimeout(() => navigate("/login"), 1800);
    } catch (err: any) {
      const msg = "Registration failed: " + (err?.message || JSON.stringify(err));
      toast.error(msg);
      setApiError(msg);
      console.error("Unexpected registration error:", err);
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
