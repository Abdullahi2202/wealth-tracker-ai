
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

    // Step 1: Create user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      toast.error(authError?.message || "Failed to register user.");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // Step 2: Save extra info to registrations
    const { error: dbError } = await supabase.from("registrations").insert({
      user_id: userId,
      phone,
      passport_number: passportNumber,
      image_url: "", // No image is uploaded, so keep this as an empty string
    });

    // Optionally, update 'profiles' table with full name if you use it
    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    if (dbError) {
      console.error("Error inserting into registrations:", dbError);
      toast.error(
        "Failed to store registration data." +
          (dbError.details ? " Details: " + dbError.details : "") +
          (dbError.message ? " Message: " + dbError.message : "")
      );
    } else {
      toast.success("Registered successfully! Please log in.");
      navigate("/login");
    }

    setLoading(false);
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
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
