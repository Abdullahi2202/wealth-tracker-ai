
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceCardProps {
  totalBalance: number;
  currency: string;
  monthIncome: number;
  monthExpenses: number;
  loading: boolean;
  className?: string;
}

const BalanceCard = ({
  totalBalance,
  currency,
  monthIncome,
  monthExpenses,
  loading,
  className = ""
}: BalanceCardProps) => {
  const netIncome = monthIncome - monthExpenses;
  const isPositive = netIncome >= 0;

  if (loading) {
    return (
      <Card className={`${className} border-0 shadow-lg`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">
            Account Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-0 shadow-lg bg-white`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Account Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Balance */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Total Balance</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {currency}{totalBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h3>
          <p className="text-xs text-gray-400">Available across all accounts</p>
        </div>

        {/* Monthly Summary */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Monthly Income */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Income</span>
              </div>
              <p className="text-xl font-semibold text-green-600">
                {currency}{monthIncome.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>

            {/* Monthly Expenses */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Expenses</span>
              </div>
              <p className="text-xl font-semibold text-red-600">
                {currency}{monthExpenses.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </div>

          {/* Net Income */}
          <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Net This Month</span>
              <span className={`font-semibold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                {isPositive ? '+' : ''}{currency}{netIncome.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
