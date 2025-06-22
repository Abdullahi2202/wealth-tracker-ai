
import { Button } from "@/components/ui/button";
import { Wallet } from "@/hooks/useWallet";

interface WalletBalanceDisplayProps {
  wallet: Wallet | null;
  onRefresh: () => Promise<void>;
}

export const WalletBalanceDisplay = ({ wallet, onRefresh }: WalletBalanceDisplayProps) => {
  if (!wallet) return null;

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-700">
          Current Balance: <span className="font-semibold">
            ${wallet.balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-800"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};
