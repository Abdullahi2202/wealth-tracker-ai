
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectLabel } from "@/components/ui/select";
import { CreditCard } from "lucide-react";

export type CardType = "visa" | "mastercard";

interface CardTypeSelectProps {
  value: CardType;
  onChange: (val: CardType) => void;
}

export function CardTypeSelect({ value, onChange }: CardTypeSelectProps) {
  return (
    <div>
      <label htmlFor="card-type" className="block text-sm font-medium text-gray-700 mb-2">
        Card Type
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="card-type" className="w-full bg-white">
          <CreditCard className="mr-2 text-finance-blue" size={20} />
          <SelectValue placeholder="Select Card Type" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-white">
          <SelectLabel>Select your card type</SelectLabel>
          <SelectItem value="visa">
            <span className="inline-flex items-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="w-6 h-auto" />
              Visa
            </span>
          </SelectItem>
          <SelectItem value="mastercard">
            <span className="inline-flex items-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" className="w-6 h-auto" />
              MasterCard
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
