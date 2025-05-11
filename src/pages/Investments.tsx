
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";

const Investments = () => {
  // Sample data for the chart
  const data = [
    { name: 'Jan', amount: 5000 },
    { name: 'Feb', amount: 5200 },
    { name: 'Mar', amount: 5100 },
    { name: 'Apr', amount: 5600 },
    { name: 'May', amount: 5800 },
    { name: 'Jun', amount: 6100 },
    { name: 'Jul', amount: 6500 },
  ];

  // Sample investment data
  const investments = [
    { name: "S&P 500 ETF", value: 3500, change: "+5.2%", isPositive: true },
    { name: "Tech Growth Fund", value: 1800, change: "+12.8%", isPositive: true },
    { name: "Real Estate REIT", value: 1200, change: "-2.1%", isPositive: false },
    { name: "Bond Fund", value: 850, change: "+1.4%", isPositive: true },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Investment Insights</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Total Value</p>
                  <p className="text-2xl font-bold">$7,350</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Total Return</p>
                  <p className="text-2xl font-bold text-finance-income">+$850 (13.1%)</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Your Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.map((investment, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${investment.isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                      {investment.isPositive ? (
                        <TrendingUp className="h-4 w-4 text-finance-income" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-finance-expense" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{investment.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${investment.value}</p>
                    <p 
                      className={`text-sm ${
                        investment.isPositive ? 'text-finance-income' : 'text-finance-expense'
                      }`}
                    >
                      {investment.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button className="w-full" variant="outline">View All Investments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Investments;
