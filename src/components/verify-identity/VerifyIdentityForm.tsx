import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DocumentTypeSelect, DocumentType } from "./DocumentTypeSelect";
import { DocumentNumberInput } from "./DocumentNumberInput";
import { DocumentFileUpload } from "./DocumentFileUpload";

export function VerifyIdentityForm() {
  const [documentType, setDocumentType] = useState<DocumentType>("passport");
  const [number, setNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("walletmaster_user");
    if (storedUser) {
      try {
        const data = JSON.parse(storedUser);
        setUserEmail(data.email);
      } catch {}
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
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
      const ext = file.name.split(".").pop();
      const fileName = `${userEmail}_${Date.now()}.${ext}`;
      const path = `${userEmail}/${fileName}`;

      // Change storage bucket name to identity-docs
      const { data, error: storageError } = await supabase.storage
        .from("identity-docs")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (storageError || !data) {
        console.error("Supabase storage upload error:", storageError);
        console.error("Supabase storage upload result:", data);

        if (storageError?.message?.includes("violates row-level security")) {
          toast.error("Storage upload failed due to security policy. Please contact support.");
        } else if (storageError && storageError?.message?.includes("bucket")) {
          toast.error("Storage bucket not found. Please contact support.");
        } else if (storageError) {
          toast.error(`Upload failed: ${storageError.message || "Unknown storage error."}`);
        } else {
          toast.error("Upload failed, please try again.");
        }
        setUploading(false);
        return;
      }

      // Use the updated bucket name to get public URL
      const { data: urlResult } = supabase.storage
        .from("identity-docs")
        .getPublicUrl(path);

      const publicUrl = urlResult?.publicUrl || null;

      if (!publicUrl) {
        toast.error("Error getting file URL. Please contact support.");
        setUploading(false);
        return;
      }

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
      console.error("Generic upload catch error:", error);
      toast.error("Upload failed: " + (error?.message || "Unknown error."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <CardContent>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <DocumentTypeSelect value={documentType} onChange={setDocumentType} disabled={uploading} />
        <DocumentNumberInput value={number} onChange={setNumber} documentType={documentType} disabled={uploading} />
        <DocumentFileUpload file={file} setFile={setFile} disabled={uploading} />
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
  );
}
