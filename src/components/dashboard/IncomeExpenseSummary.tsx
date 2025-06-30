
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface IncomeExpenseSummaryProps {
  monthIncome: number;
  monthExpenses: number;
  loading: boolean;
}

const IncomeExpenseSummary = ({ monthIncome, monthExpenses, loading }: IncomeExpenseSummaryProps) => {
  const netIncome = monthIncome - monthExpenses;
  const isPositive = netIncome >= 0;

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Monthly Income */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Income</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              ${monthIncome.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>

          {/* Monthly Expenses */}
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Expenses</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              ${monthExpenses.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        {/* Net Income */}
        <div className={`p-3 rounded-lg text-center ${isPositive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <span className="text-sm font-medium text-gray-700">Net Amount</span>
          <p className={`text-lg font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {isPositive ? '+' : ''}${netIncome.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseSummary;
