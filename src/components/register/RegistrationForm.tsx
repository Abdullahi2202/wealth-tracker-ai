
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
      console.log("Starting registration process for:", email);

      // Step 1: Create user account with proper metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            passport_number: passportNumber,
            document_type: documentType
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

      console.log("Auth user created successfully:", authData.user.id);

      // Step 2: Use the user-management edge function to create the user record
      try {
        const { data: userData, error: userCreateError } = await supabase.functions.invoke('user-management', {
          method: 'POST',
          body: {
            email: email,
            full_name: fullName,
            phone: phone,
            passport_number: passportNumber,
            document_type: documentType,
            image_url: null // Will be updated when document is uploaded
          }
        });

        if (userCreateError) {
          console.error("Error creating user record via edge function:", userCreateError);
          // Fallback: try direct insertion
          const { error: directInsertError } = await supabase.from("users").insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            phone: phone,
            passport_number: passportNumber,
            document_type: documentType,
            verification_status: "pending",
            is_active: true
          });

          if (directInsertError) {
            console.error("Direct insert also failed:", directInsertError);
            toast.error("User account created but profile setup incomplete. Please contact support.");
          } else {
            console.log("User record created via direct insert");
          }
        } else {
          console.log("User record created successfully via edge function");
        }
      } catch (userRecordError) {
        console.error("Error in user record creation:", userRecordError);
        // Try fallback direct insertion
        const { error: fallbackError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          passport_number: passportNumber,
          document_type: documentType,
          verification_status: "pending",
          is_active: true
        });

        if (fallbackError) {
          console.error("Fallback insert failed:", fallbackError);
        }
      }

      // Step 3: Check if this is an admin user and update role if needed
      if (email === "kingabdalla982@gmail.com") {
        try {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: authData.user.id, role: "admin" })
            .single();

          if (roleError) {
            console.error("Error setting admin role:", roleError);
          } else {
            console.log("Admin role set successfully");
          }
        } catch (roleSetError) {
          console.error("Admin role setting failed:", roleSetError);
        }
      }

      // Step 4: Create wallet for the user
      try {
        const { error: walletError } = await supabase.from("wallets").insert({
          user_id: authData.user.id,
          balance: 0,
          currency: "USD"
        });

        if (walletError) {
          console.error("Error creating wallet:", walletError);
          // Don't show error to user as this is not critical for registration
        } else {
          console.log("Wallet created successfully");
        }
      } catch (walletCreateError) {
        console.error("Wallet creation failed:", walletCreateError);
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
