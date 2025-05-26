
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type DocumentType = "passport" | "license";
type UploadProps = {
  email: string;
  documentType: DocumentType;
  onSubmitted?: () => void;
};

const bucket = "identity-docs";

export default function IdentityVerificationUpload({ email, documentType, onSubmitted }: UploadProps) {
  const [uploading, setUploading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [number, setNumber] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleUpload() {
    if (!docInputRef.current || !docInputRef.current.files?.[0]) return;
    const file = docInputRef.current.files[0];
    if (!file.name.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      toast.error("Only jpg, png, or pdf files allowed");
      return;
    }
    setUploading(true);
    // Unique file path: user-email/timestamp-filename
    const path = `${email}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });

    if (uploadErr) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    setFileName(path);
    toast.success("File uploaded. Submitting verification request...");
    // Submit verification request
    const { error: reqErr } = await supabase.from("identity_verification_requests").insert({
      email,
      document_type: documentType,
      new_document_url: path,
      new_number: number || null,
      status: "pending",
    });
    setUploading(false);
    if (reqErr) {
      toast.error("Failed to submit verification request");
    } else {
      toast.success("Request submitted for admin review");
      setFileName(null);
      setNumber("");
      if (onSubmitted) onSubmitted();
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <label className="font-semibold" htmlFor="doc">
        Upload new {documentType === "passport" ? "Passport" : "Driver's License"} (photo or PDF)
      </label>
      <Input
        ref={docInputRef}
        id="doc"
        type="file"
        accept="image/*,.pdf"
        disabled={uploading}
        className="mb-1"
      />
      <Input
        placeholder={
          documentType === "passport" ? "Passport Number (if changed)" : "License Number (if changed)"
        }
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        disabled={uploading}
      />
      <Button disabled={uploading} onClick={handleUpload}>
        {uploading ? "Uploading..." : "Submit for Review"}
      </Button>
    </div>
  );
}
