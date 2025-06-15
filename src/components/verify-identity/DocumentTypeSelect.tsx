
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DocumentType = "passport" | "license";

type DocumentTypeSelectProps = {
  value: DocumentType;
  onChange: (value: DocumentType) => void;
  disabled?: boolean;
};

export function DocumentTypeSelect({ value, onChange, disabled }: DocumentTypeSelectProps) {
  return (
    <div>
      <label className="block mb-1 font-semibold sm:text-base text-sm" htmlFor="docType">
        What document are you uploading?
      </label>
      <Select value={value} onValueChange={v => onChange(v as DocumentType)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select document type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="passport">Passport</SelectItem>
          <SelectItem value="license">Driver&apos;s License</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
