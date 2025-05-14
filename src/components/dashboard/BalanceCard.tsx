
import { CreditCard, Send, Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useNavigate } from "react-router-dom";

interface BalanceCardProps {
  totalBalance: number;
  currency?: string;
}

const BalanceCard = ({ totalBalance, currency = "$" }: BalanceCardProps) => {
  const navigate = useNavigate();

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
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-xs opacity-70">This Month's Income</p>
              <p className="text-lg font-medium">{currency}3,580.00</p>
            </div>
            <div>
              <p className="text-xs opacity-70">This Month's Expenses</p>
              <p className="text-lg font-medium">{currency}2,149.25</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  onClick={() => navigate("/payments")}
                  variant="outline"
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Pay
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Payment Options</h4>
                  <p className="text-sm">Pay using your wallet balance or saved cards</p>
                  <div className="flex gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <Wallet className="h-3 w-3" /> Wallet Balance
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      <CreditCard className="h-3 w-3" /> Saved Cards
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  onClick={() => navigate("/payments?tab=request")}
                  variant="outline"
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white flex items-center justify-center gap-2"
                >
                  <ArrowDown className="h-4 w-4" />
                  Receive
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Deposit Options</h4>
                  <p className="text-sm">Received money can only be deposited to:</p>
                  <div className="flex gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <Wallet className="h-3 w-3" /> Wallet Balance
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      <ArrowDown className="h-3 w-3" /> Bank Account
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Note: Money cannot be received directly onto cards</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
