
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, RefreshCw, TrendingUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";

interface WalletBalanceCardProps {
  className?: string;
}

const WalletBalanceCard = ({ className = "" }: WalletBalanceCardProps) => {
  const { wallet, balance, loading, refetch } = useWallet();
  const [showBalance, setShowBalance] = useState(true);

  const handleRefresh = () => {
    refetch();
  };

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  return (
    <Card className={`${className} border-0 shadow-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden relative`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-100">Digital Wallet</h3>
              <p className="text-xs text-blue-200">Available Balance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBalanceVisibility}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2"
            >
              {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <Skeleton className="h-12 w-48 bg-white/20" />
          ) : (
            <div className="space-y-1">
              <h2 className="text-4xl font-bold text-white">
                {showBalance ? (
                  `$${balance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                ) : (
                  "••••••"
                )}
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-300" />
                <span className="text-green-300">Available for spending</span>
              </div>
            </div>
          )}

          {wallet && (
            <div className="pt-4 border-t border-white/20">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-200">Wallet ID</p>
                  <p className="text-white font-medium">
                    {wallet.wallet_number ? `#${wallet.wallet_number}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-blue-200">Last Updated</p>
                  <p className="text-white font-medium">
                    {new Date(wallet.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
