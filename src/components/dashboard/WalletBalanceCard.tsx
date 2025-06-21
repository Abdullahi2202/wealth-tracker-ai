
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/useWallet";

interface WalletBalanceCardProps {
  className?: string;
}

const WalletBalanceCard = ({ className = "" }: WalletBalanceCardProps) => {
  const { wallet, balance, loading, refetch } = useWallet();

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <h3 className="text-2xl font-bold text-gray-900">
                  ${balance.toLocaleString("en-US", {
                    minimimFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h3>
              )}
              {wallet && (
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(wallet.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
