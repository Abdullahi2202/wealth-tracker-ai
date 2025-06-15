
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

  // Back to Profile
  const handleBack = () => {
    navigate("/profile");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      toast.error("Could not find your account email.");
      return;
    }
    if (!number || !file) {
      toast.error("Please enter your document number and upload the photo.");
      return;
    }
    setUploading(true);
    try {
      // Upload to "identity-documents" storage
      const ext = file.name.split(".").pop();
      const fileName = `${userEmail}_${Date.now()}.${ext}`;
      const path = `${userEmail}/${fileName}`;

      const { data, error: storageError } = await supabase.storage
        .from("identity-documents")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (storageError) {
        if (storageError.message.includes("violates row-level security")) {
          toast.error("Storage upload failed due to security policy. Please contact support.");
        } else if (storageError.message.includes("bucket")) {
          toast.error("Storage bucket not found. Please contact support.");
        } else {
          toast.error(`Upload failed: ${storageError.message || "Unknown storage error."}`);
        }
        setUploading(false);
        return;
      }
      if (!data) {
        toast.error("Upload failed, please try again.");
        setUploading(false);
        return;
      }

      const { data: urlResult } = supabase.storage
        .from("identity-documents")
        .getPublicUrl(path);

      const publicUrl = urlResult?.publicUrl || null;

      if (!publicUrl) {
        toast.error("Error getting file URL. Please contact support.");
        setUploading(false);
        return;
      }

      // Insert into identity_verification_requests table
      const { error: insertError } = await supabase
        .from("identity_verification_requests")
        .insert([
          {
            user_email: userEmail,
            document_type: documentType,
            document_number: number,
            image_url: publicUrl,
            status: "pending"
          }
        ]);

      if (insertError) {
        toast.error("Failed to submit for review: " + (insertError.message ?? "Unknown error."));
        setUploading(false);
        return;
      }

      toast.success("Your document was submitted for verification!");
      setTimeout(() => navigate("/profile"), 1200);
    } catch (error: any) {
      toast.error("Upload failed: " + (error?.message || "Unknown error."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-slate-100 to-blue-100 px-2">
      <Card className="w-full max-w-md sm:max-w-lg shadow-xl rounded-xl mx-auto mt-16 mb-8 animate-fade-in">
        <CardHeader className="relative pb-3">
          <button
            className="absolute left-2 top-2 flex items-center text-muted-foreground hover:text-primary transition-colors rounded-lg px-2 py-1 focus:outline-none bg-transparent"
            type="button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 mr-1" aria-hidden="true" />
            <span className="text-sm font-medium">Back to Profile</span>
          </button>
          <CardTitle className="pl-8 text-2xl sm:text-3xl font-bold tracking-tight">
            Verify Your Identity
          </CardTitle>
          <CardDescription className="pl-8 pt-1 text-base sm:text-lg text-muted-foreground">
            For your security, upload an official document.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block mb-1 font-semibold sm:text-base text-sm" htmlFor="docType">
                What document are you uploading?
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
              <label className="block mb-1 font-semibold sm:text-base text-sm" htmlFor="docNumber">
                {documentType === "passport" ? "Passport Number" : "License Number"}
              </label>
              <Input
                id="docNumber"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder={documentType === "passport" ? "Enter passport number" : "Enter license number"}
                required
                className="text-base sm:text-base font-medium bg-slate-50 border-gray-300"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold sm:text-base text-sm" htmlFor="docImg">
                Upload Photo (JPG/PNG, max 5MB)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" onClick={handleUploadClick} disabled={uploading} className="sm:px-3 px-2 py-1 sm:py-2">
                  {file ? "Change File" : "Choose File"}
                </Button>
                {file && <span className="text-sm text-green-700 break-all">{file.name}</span>}
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
            <Button
              type="submit"
              className="w-full mt-2 py-3 text-lg sm:text-lg rounded-xl"
              disabled={uploading}
            >
              {uploading ? "Submitting..." : "Submit for Verification"}
            </Button>
          </form>
          <div className="text-xs text-muted-foreground pt-5 text-center">
            All information is kept secure and private. For help, contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyIdentity;

// ... File is 219 lines, consider refactoring into smaller components for easier maintenance.
