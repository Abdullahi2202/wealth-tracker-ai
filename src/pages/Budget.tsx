import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Budget = () => {
  const [goal, setGoal] = useState(2000); // default, could fetch from db
  const [current, setCurrent] = useState(1250); // stub, could auto-calc from incomes - expenses

  const handleSetGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just a stub, but here you could persist the goal in db!
    toast.success("Budget goal set!");
  };

  const savingsGoals = [
    { name: "Emergency Fund", target: 10000, current: 6500, color: "#8b5cf6" },
    { name: "Vacation", target: 3000, current: 1800, color: "#06b6d4" },
    { name: "New Car", target: 25000, current: 5000, color: "#f97316" },
    { name: "Home Down Payment", target: 50000, current: 12000, color: "#ec4899" }
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Savings Insights</h1>
      <div className="mb-6">
        <form onSubmit={handleSetGoal} className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Monthly Budget Goal
            </label>
            <Input
              type="number"
              value={goal}
              min={0}
              onChange={e => setGoal(Number(e.target.value))}
              className="w-32"
            />
          </div>
          <Button type="submit" className="h-10">
            Set Goal
          </Button>
        </form>
        <div className="mt-2 text-sm text-muted-foreground">
          This month you've spent <span className="font-semibold">${current}</span> out of your goal ${goal}.<br />
          {current < goal ? (
            <span className="text-finance-income">On track!</span>
          ) : (
            <span className="text-finance-expense">Over budget!</span>
          )}
        </div>
      </div>
      
      <div className="grid gap-6">
        <Card className="bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              <CardTitle>Savings Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Total Saved</p>
                <p className="text-3xl font-bold">$25,300</p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-finance-income">+12%</span> from last month
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Monthly Savings Rate</p>
                <p className="text-3xl font-bold">$1,250</p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-finance-income">18%</span> of monthly income
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Savings Goals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {savingsGoals.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-sm">
                      ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(goal.current / goal.target) * 100} 
                    className="h-2"
                    style={{ 
                      "--progress-background": goal.color 
                    } as React.CSSProperties}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {Math.round((goal.current / goal.target) * 100)}% complete
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Budget;
