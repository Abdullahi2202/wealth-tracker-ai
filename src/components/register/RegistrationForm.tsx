
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

// Debug log
console.log("RegistrationForm loaded ✅");

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    passportNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { fullName, email, password, phone, passportNumber } = form;

    if (!fullName || !email || !password || !phone || !passportNumber) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) {
        console.error("Registration error:", authError);
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered. Please try logging in instead.");
          navigate("/login");
        } else {
          toast.error("Registration failed: " + authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      console.log("User created successfully:", authData.user.email);

      // Step 2: Save additional registration info
      const { error: dbError } = await supabase.from("registrations").insert({
        email: authData.user.email!,
        full_name: fullName,
        phone,
        passport_number: passportNumber,
        image_url: "",
      });

      if (dbError) {
        console.error("Error saving registration data:", dbError);
        // Don't fail the entire registration if this fails
        toast.error("Registration completed but some data may not have been saved properly.");
      }

      // Step 3: Check if this is an admin user and update role if needed
      if (email === "kingabdalla982@gmail.com") {
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: "admin" })
          .eq("email", email);

        if (roleError) {
          console.error("Error setting admin role:", roleError);
        } else {
          console.log("Admin role set successfully");
        }
      }

      toast.success("Registration successful! Please check your email for verification, then log in.");
      navigate("/login");

    } catch (error) {
      console.error("Unexpected registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg p-4">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input
            type="text"
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <Input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
          <Input
            placeholder="Passport / Driver's License Number"
            value={form.passportNumber}
            onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>

        {/* Admin user guidance */}
        {form.email === "kingabdalla982@gmail.com" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Admin Account:</strong> You're registering as an admin user. 
              Your account will automatically receive admin privileges.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
