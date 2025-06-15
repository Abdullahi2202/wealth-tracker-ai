
import { Input } from "@/components/ui/input";
import type { DocumentType } from "./DocumentTypeSelect";

type DocumentNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  documentType: DocumentType;
  disabled?: boolean;
};

export function DocumentNumberInput({ value, onChange, documentType, disabled }: DocumentNumberInputProps) {
  return (
    <div>
      <label className="block mb-1 font-semibold sm:text-base text-sm" htmlFor="docNumber">
        {documentType === "passport" ? "Passport Number" : "License Number"}
      </label>
      <Input
        id="docNumber"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={documentType === "passport" ? "Enter passport number" : "Enter license number"}
        required
        className="text-base sm:text-base font-medium bg-slate-50 border-gray-300"
        autoComplete="off"
        disabled={disabled}
      />
    </div>
  );
}
