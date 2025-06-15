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
    // Removed all document and admin fields
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, email, password, phone } = form;
    if (!fullName || !email || !password || !phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      // 1. Check for duplicates
      const { data: exist } = await supabase
        .from("registration")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (exist) {
        toast.error("This email is already registered. Please log in instead.");
        navigate("/login");
        setLoading(false);
        return;
      }

      // 2. Insert user (no document info)
      const { error } = await supabase.from("registration").insert({
        email,
        password,
        full_name: fullName,
        phone,
        verification_status: "unverified",
        // document info will be filled later, after registration
      });
      if (error) throw error;
      toast.success("Registration successful! You can now login.");
      navigate("/login");
    } catch (err) {
      toast.error("Registration failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg p-4">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
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
