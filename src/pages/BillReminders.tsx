
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const BillReminders = () => {
  // For now, just demo content - this will be powered by a new table we will add via SQL!
  const [open, setOpen] = useState(false);

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Bill Reminders</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">No reminders yet. (This will update once we migrate the DB!)</div>
          <Button onClick={() => setOpen(true)} className="w-full">
            + Add Bill Reminder
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default BillReminders;
