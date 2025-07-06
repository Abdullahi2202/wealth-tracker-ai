
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
import { useIsMobile } from "@/hooks/use-mobile";

const Transactions = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { transactions, loading, error } = useTransactions();
  const isMobile = useIsMobile();

  const incomeTransactions = useMemo(() => 
    transactions.filter(t => t.type === 'income'), 
    [transactions]
  );

  const expenseTransactions = useMemo(() => 
    transactions.filter(t => t.type === 'expense'), 
    [transactions]
  );

  const pendingTransactions = useMemo(() => 
    transactions.filter(t => t.status === 'pending'), 
    [transactions]
  );

  return (
    <DashboardLayout>
      <div className={`${isMobile ? 'px-2' : ''}`}>
        <h1 className={`font-bold tracking-tight mb-4 ${isMobile ? 'text-2xl' : 'text-3xl mb-6'}`}>Transactions</h1>
        <div className={`flex justify-end ${isMobile ? 'mb-3' : 'mb-4'}`}>
          <Button onClick={() => setDrawerOpen(true)} size={isMobile ? "sm" : "default"}>
            + Add Transaction
          </Button>
        </div>
        <TransactionDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        
        {/* Pie Charts - Mobile Optimized */}
        <div className={isMobile ? 'mb-4' : ''}>
          <TransactionCharts />
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className={`mb-4 ${isMobile ? 'w-full grid-cols-2' : ''}`}>
            <TabsTrigger value="all" className={isMobile ? 'text-xs' : ''}>All</TabsTrigger>
            <TabsTrigger value="pending" className={isMobile ? 'text-xs' : ''}>
              Pending ({pendingTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="income" className={isMobile ? 'text-xs' : ''}>
              <ArrowUp className="mr-1 h-4 w-4 text-finance-income" />
              {isMobile ? 'In' : 'Income'}
            </TabsTrigger>
            <TabsTrigger value="expense" className={isMobile ? 'text-xs' : ''}>
              <ArrowDown className="mr-1 h-4 w-4 text-finance-expense" />
              {isMobile ? 'Out' : 'Expense'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader className={isMobile ? 'pb-3' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>All Transactions</CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'pt-0' : ''}>
                <RecentTransactions transactions={transactions} loading={loading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader className={isMobile ? 'pb-3' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Pending Transactions</CardTitle>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  These transactions are awaiting admin approval
                </p>
              </CardHeader>
              <CardContent className={isMobile ? 'pt-0' : ''}>
                <RecentTransactions transactions={pendingTransactions} loading={loading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="income">
            <Card>
              <CardHeader className={isMobile ? 'pb-3' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Income Transactions</CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'pt-0' : ''}>
                <RecentTransactions transactions={incomeTransactions} loading={loading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expense">
            <Card>
              <CardHeader className={isMobile ? 'pb-3' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Expense Transactions</CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'pt-0' : ''}>
                <RecentTransactions transactions={expenseTransactions} loading={loading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
