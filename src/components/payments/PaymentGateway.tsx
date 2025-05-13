
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaymentGatewayOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  bgColor?: string;
}

interface PaymentGatewayProps {
  selectedGateway: string;
  onGatewayChange: (gateway: string) => void;
}

export const paymentGateways: PaymentGatewayOption[] = [
  {
    id: "card",
    name: "Credit/Debit Card",
    icon: <CreditCard className="h-6 w-6" />,
    description: "Pay securely with your credit or debit card",
    bgColor: "bg-gradient-to-r from-blue-500 to-blue-600",
  }
];

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  selectedGateway,
  onGatewayChange
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Payment Method</h3>
      <RadioGroup
        value={selectedGateway}
        onValueChange={onGatewayChange}
        className="grid gap-4"
      >
        {paymentGateways.map((gateway) => (
          <label
            key={gateway.id}
            htmlFor={gateway.id}
            className="cursor-pointer"
          >
            <Card className={cn(
              "border-2 transition-all", 
              selectedGateway === gateway.id 
                ? "border-primary shadow-md" 
                : "border-border hover:border-primary/50"
            )}>
              <CardContent className="flex p-4 items-center gap-4">
                <RadioGroupItem value={gateway.id} id={gateway.id} />
                <div className={cn(
                  "p-2 rounded-md text-white",
                  gateway.bgColor
                )}>
                  {gateway.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{gateway.name}</p>
                  <p className="text-sm text-muted-foreground">{gateway.description}</p>
                </div>
              </CardContent>
            </Card>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};

export default PaymentGateway;
