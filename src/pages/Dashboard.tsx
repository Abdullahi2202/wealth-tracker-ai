import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

const Dashboard = () => {
  const [totalBalance, setTotalBalance] = useState(0);
  const [myRegistration, setMyRegistration] = useState<null | {
    phone: string;
    passport_number: string;
    image_url: string;
  }>(null);

  useEffect(() => {
    setTimeout(() => {
      setTotalBalance(4931.17);
    }, 800);
    // Fetch user's registration
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) return;
      const { data: regData } = await supabase
        .from("registrations")
        .select("phone, passport_number, image_url")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setMyRegistration(regData || null);
    })();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {myRegistration && (
          <Card className="mb-6">
            <CardContent>
              <div>
                <h2 className="font-semibold mb-2">Your Registration Details</h2>
                <div className="mb-1">Phone: {myRegistration.phone}</div>
                <div className="mb-1">Passport #: {myRegistration.passport_number}</div>
                <div className="mb-1">
                  <a
                    href={
                      supabase.storage.from("user-ids").getPublicUrl(myRegistration.image_url).data.publicUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Uploaded ID Image
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <BalanceCard totalBalance={totalBalance} />
          </div>
          <div className="md:col-span-2">
            <ExpenseChart />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
