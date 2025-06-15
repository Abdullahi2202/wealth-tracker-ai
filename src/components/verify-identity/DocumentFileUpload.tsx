
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type DocumentFileUploadProps = {
  file: File | null;
  setFile: (f: File | null) => void;
  disabled?: boolean;
};

export function DocumentFileUpload({ file, setFile, disabled }: DocumentFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  return (
    <div>
      <label className="block mb-1 font-semibold sm:text-base text-sm" htmlFor="docImg">
        Upload Photo (JPG/PNG, max 5MB)
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" variant="outline" onClick={handleUploadClick} disabled={disabled} className="sm:px-3 px-2 py-1 sm:py-2">
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
        disabled={disabled}
      />
    </div>
  );
}
