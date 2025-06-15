
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Investment {
  id: string;
  name: string;
  value: number;
  change_pct: number;
  is_positive: boolean;
}

const Investments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for investments since the table doesn't exist
    const mockInvestments: Investment[] = [
      {
        id: "1",
        name: "Tech Growth Fund",
        value: 15000,
        change_pct: 5.2,
        is_positive: true
      },
      {
        id: "2", 
        name: "Blue Chip Stocks",
        value: 25000,
        change_pct: -1.8,
        is_positive: false
      },
      {
        id: "3",
        name: "Crypto Portfolio", 
        value: 8500,
        change_pct: 12.3,
        is_positive: true
      }
    ];

    // Simulate loading
    setTimeout(() => {
      setInvestments(mockInvestments);
      setLoading(false);
    }, 1000);
  }, []);

  const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Investments</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Portfolio Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-muted-foreground">Total Portfolio Value</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investments.map((investment) => (
            <Card key={investment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{investment.name}</h3>
                    <div className="text-2xl font-bold">${investment.value.toLocaleString()}</div>
                  </div>
                  <div className={`flex items-center gap-1 ${investment.is_positive ? 'text-green-600' : 'text-red-600'}`}>
                    {investment.is_positive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-medium">{Math.abs(investment.change_pct)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Investments;
