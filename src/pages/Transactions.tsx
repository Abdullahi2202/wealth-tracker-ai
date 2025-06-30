
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown } from "lucide-react";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import TransactionDrawer from "@/components/transactions/TransactionDrawer";
import TransactionCharts from "@/components/transactions/TransactionCharts";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";

const Transactions = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { transactions, loading, error } = useTransactions();

  const incomeTransactions = useMemo(() => 
    transactions.filter(t => t.type === 'income'), 
    [transactions]
  );

  const expenseTransactions = useMemo(() => 
    transactions.filter(t => t.type === 'expense'), 
    [transactions]
  );

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Transactions</h1>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setDrawerOpen(true)}>
          + Add Transaction
        </Button>
      </div>
      <TransactionDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      
      {/* Pie Charts */}
      <TransactionCharts />
      
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
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions transactions={transactions} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions transactions={incomeTransactions} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expense">
          <Card>
            <CardHeader>
              <CardTitle>Expense Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions transactions={expenseTransactions} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Transactions;
