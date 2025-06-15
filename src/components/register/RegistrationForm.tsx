
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import DocumentUpload from "./DocumentUpload";

type DocumentType = "passport" | "license";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    passportNumber: "",
  });
  const [documentType, setDocumentType] = useState<DocumentType>("passport");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadDocument = async (file: File, email: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${email}-${documentType}-${Date.now()}.${fileExt}`;
    const filePath = `identity-docs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('identity-docs')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error('Failed to upload document: ' + uploadError.message);
    }

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { fullName, email, password, phone, passportNumber } = form;

    if (!fullName || !email || !password || !phone || !passportNumber) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!selectedFile) {
      toast.error("Please upload your identity document.");
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

      // Step 2: Upload document
      const documentPath = await uploadDocument(selectedFile, email);

      // Step 3: Save registration data with document info
      const { error: dbError } = await supabase.from("registrations").insert({
        email: authData.user.email!,
        full_name: fullName,
        phone,
        passport_number: passportNumber,
        image_url: documentPath,
        document_type: documentType,
        verification_status: "pending"
      });

      if (dbError) {
        console.error("Error saving registration data:", dbError);
        toast.error("Registration completed but some data may not have been saved properly.");
      }

      // Step 4: Create verification request
      const { error: verificationError } = await supabase
        .from("identity_verification_requests")
        .insert({
          email: authData.user.email!,
          document_type: documentType,
          new_document_url: documentPath,
          new_number: passportNumber,
          status: "pending"
        });

      if (verificationError) {
        console.error("Error creating verification request:", verificationError);
      }

      // Step 5: Check if this is an admin user and update role if needed
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

      toast.success("Registration successful! Your identity is being verified. You'll receive an email notification once verification is complete.");
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

          <div>
            <Label htmlFor="passportNumber">
              {documentType === "passport" ? "Passport" : "Driver's License"} Number
            </Label>
            <Input
              id="passportNumber"
              placeholder={`Enter your ${documentType === "passport" ? "passport" : "driver's license"} number`}
              value={form.passportNumber}
              onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))}
              required
            />
          </div>

          <DocumentUpload
            documentType={documentType}
            onDocumentTypeChange={setDocumentType}
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
          />

          <Button type="submit" disabled={loading} className="mt-4">
            {loading ? "Registering..." : "Register & Submit for Verification"}
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

        {/* Verification Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Identity Verification:</strong> After registration, your identity will be verified by our admin team. 
            You'll receive an email notification once verification is complete (usually within 15 seconds to a few hours).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
