
import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BalanceCardProps {
  totalBalance: number;
  currency?: string;
}

const BalanceCard = ({ totalBalance, currency = "$" }: BalanceCardProps) => {
  return (
    <Card className="wallet-card text-white h-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium opacity-80">Total Balance</p>
            <h3 className="text-3xl font-bold mt-1">
              {currency}{totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <p className="text-sm mt-4 opacity-90">Available across all accounts</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex justify-between">
            <div>
              <p className="text-xs opacity-70">This Month's Income</p>
              <p className="text-lg font-medium">{currency}3,580.00</p>
            </div>
            <div>
              <p className="text-xs opacity-70">This Month's Expenses</p>
              <p className="text-lg font-medium">{currency}2,149.25</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
