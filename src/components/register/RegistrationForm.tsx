
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const RegistrationForm = () => {
  const [form, setForm] = useState({
    phone: "",
    passportNumber: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If user already registered, redirect to dashboard
    const checkRegistration = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }
      const { data } = await supabase
        .from("registrations")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) {
        toast.info("You already registered.");
        navigate("/dashboard");
      }
    };
    checkRegistration();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Session expired. Please log in again.");
      setSubmitting(false);
      return;
    }
    if (!form.phone || !form.passportNumber || !imageFile) {
      toast.error("Please fill all fields.");
      setSubmitting(false);
      return;
    }

    // 1. Upload image
    const fileExt = imageFile.name.split('.').pop();
    const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("user-ids")
      .upload(filePath, imageFile, { upsert: false });

    if (uploadError) {
      toast.error(`Failed to upload image: ${uploadError.message}`);
      setSubmitting(false);
      return;
    }

    // Get public URL (admin can access, user downloads via API)
    const imageUrl = uploadData ? uploadData.path : filePath;

    // 2. Store registration info
    const { error } = await supabase.from("registrations").insert({
      user_id: session.user.id,
      phone: form.phone,
      passport_number: form.passportNumber,
      image_url: imageUrl,
    });

    if (error) {
      toast.error("Failed to submit registration.");
    } else {
      toast.success("Registration submitted!");
      navigate("/dashboard");
    }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
          <div>
            <label className="block font-medium mb-1">Phone Number</label>
            <Input
              required
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={e =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              type="tel"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Passport Number</label>
            <Input
              required
              placeholder="Enter your passport/driver's license number"
              value={form.passportNumber}
              onChange={e =>
                setForm((f) => ({ ...f, passportNumber: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Upload Passport or Driver’s License
            </label>
            <Input
              required
              type="file"
              accept="image/*"
              onChange={e =>
                setImageFile(e.target.files ? e.target.files[0] : null)
              }
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
