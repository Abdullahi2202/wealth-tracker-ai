
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const VerifyIdentity = () => {
  const [documentType, setDocumentType] = useState<"passport" | "license">("passport");
  const [number, setNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage registration
    const storedUser = localStorage.getItem("walletmaster_user");
    if (storedUser) {
      try {
        const data = JSON.parse(storedUser);
        setUserEmail(data.email);
      } catch {}
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast.error("Please upload a JPEG, JPG, or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be less than 5MB.");
      return;
    }
    setFile(file);
    toast.success("File selected");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      toast.error("Could not find your account.");
      return;
    }
    if (!number || !file) {
      toast.error("Please enter your document number and upload the document image.");
      return;
    }
    setUploading(true);
    try {
      // Upload to storage
      const ext = file.name.split(".").pop();
      const fileName = `${userEmail}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("identity-documents")
        .upload(`${userEmail}/${fileName}`, file, {
          cacheControl: "3600",
          upsert: true,
        });
      if (error) {
        // Provide full detail for easy debugging
        console.error("Supabase storage upload error:", error);
        toast.error("Upload failed, please try again. Ensure your file is JPEG, JPG, or PNG and less than 5MB.");
        setUploading(false);
        return;
      }
      if (!data) {
        console.error("No data returned from storage upload.");
        toast.error("Upload failed, please try again.");
        setUploading(false);
        return;
      }
      const { data: url } = await supabase.storage
        .from("identity-documents")
        .getPublicUrl(`${userEmail}/${fileName}`);
      const publicUrl = url?.publicUrl || null;

      // Update registration table
      const { error: updateError } = await supabase
        .from("registration")
        .update({
          document_type: documentType,
          passport_number: number,
          image_url: publicUrl,
          verification_status: "pending",
        })
        .eq("email", userEmail);
      if (updateError) {
        console.error("Supabase registration update error:", updateError);
        toast.error("Failed to update registration, please contact support.");
        setUploading(false);
        return;
      }

      toast.success("Document submitted for verification!");
      navigate("/profile");
    } catch (error) {
      console.error("Unexpected upload error:", error);
      toast.error("Upload failed, please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-muted">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="relative pb-3">
          <button
            className="absolute left-2 top-2 flex items-center text-muted-foreground hover:text-primary transition-colors"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{ background: "none", border: "none", padding: 0 }}
          >
            <ArrowLeft className="h-5 w-5 mr-1" aria-hidden="true" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <CardTitle className="pl-8">Identity Verification</CardTitle>
          <CardDescription className="pl-8">
            Upload your identity document to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="block mb-1 font-medium" htmlFor="docType">
                Document Type
              </label>
              <Select value={documentType} onValueChange={v => setDocumentType(v as "passport" | "license")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="license">Driver's License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="docNumber">
                {documentType === "passport" ? "Passport Number" : "License Number"}
              </label>
              <Input
                id="docNumber"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder={documentType === "passport" ? "Enter passport number" : "Enter license number"}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="docImg">
                Document Photo (JPEG/JPG/PNG, max 5MB)
              </label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleUploadClick} disabled={uploading}>
                  {file ? "Change File" : "Choose File"}
                </Button>
                {file && <span className="text-sm text-green-700">{file.name}</span>}
              </div>
              <Input
                ref={fileInputRef}
                id="docImg"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={uploading}>
              {uploading ? "Submitting..." : "Submit for Verification"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyIdentity;
