
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, LineChart } from "lucide-react";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

const Transactions = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Transactions</h1>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">
            <ArrowUp className="mr-1 h-4 w-4 text-finance-income" />
            Income
          </TabsTrigger>
          <TabsTrigger value="expense">
            <ArrowDown className="mr-1 h-4 w-4 text-finance-expense" />
            Expense
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Income-specific content will go here */}
              <RecentTransactions />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expense">
          <Card>
            <CardHeader>
              <CardTitle>Expense Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Expense-specific content will go here */}
              <RecentTransactions />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Transactions;
