import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import RegistrationForm from "@/components/register/RegistrationForm";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    passportNumber: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { email, password, phone, passportNumber } = form;

    if (!email || !password || !phone || !passportNumber || !imageFile) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // Step 1: Create Supabase Auth user
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

    // Step 2: Upload ID image
    const ext = imageFile.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("user-ids")
      .upload(filePath, imageFile);

    if (uploadError) {
      toast.error(`Image upload failed: ${uploadError.message}`);
      setLoading(false);
      return;
    }

    // Step 3: Save extra user info
    const { error: dbError } = await supabase.from("registrations").insert({
      user_id: userId,
      phone,
      passport_number: passportNumber,
      image_url: filePath,
    });

    if (dbError) {
      toast.error("Failed to store registration data.");
    } else {
      toast.success("Registered successfully! Please log in.");
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-10 p-4 shadow-lg">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center">Create Account</h2>
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
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
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

export default Register;
