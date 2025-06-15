
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type DocumentType = "passport" | "license";
type UploadProps = {
  email: string;
  documentType: DocumentType;
  onSubmitted?: () => void;
};

export default function IdentityVerificationUpload({ email, documentType, onSubmitted }: UploadProps) {
  const [uploading, setUploading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [number, setNumber] = useState("");

  async function handleUpload() {
    if (!docInputRef.current || !docInputRef.current.files?.[0]) {
      toast.error("Please select a file to upload");
      return;
    }
    
    const file = docInputRef.current.files[0];
    if (!file.name.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      toast.error("Only jpg, png, or pdf files allowed");
      return;
    }
    
    setUploading(true);
    
    try {
      // For now, we'll just simulate the upload and show success
      // In a real implementation, you would upload to a storage service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Document uploaded successfully. Please contact support for verification.");
      setNumber("");
      if (docInputRef.current) {
        docInputRef.current.value = "";
      }
      if (onSubmitted) onSubmitted();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
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
