import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

const TopUpWallet = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("wallet");
  const [method, setMethod] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("Top-Up");
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { methods } = usePaymentMethods();

  // Choose default payment method if available
  useEffect(() => {
    if (!method && methods.length > 0) setMethod(methods[0].id);
  }, [methods]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!method) {
      toast.error("Choose a payment method.");
      return;
    }
    setLoading(true);
    const amountValue = parseFloat(amount);

    // Simulate adding a top-up transaction
    const storedUser = localStorage.getItem("walletmaster_user");
    let email = "";
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        email = userObj.email || "";
      } catch {}
    }
    await supabase.from("transactions").insert({
      amount: amountValue,
      type: "income",
      name: "Wallet Top-Up",
      category,
      tag: tag || null,
      note: note || null,
      date: new Date().toISOString().split("T")[0],
      email,
      source_method_id: method || null,
    });
    setTimeout(() => {
      toast.success(`$${amountValue.toFixed(2)} added to your wallet.`);
      setLoading(false);
      setAmount("");
      setDetails("");
      setNote("");
      setTag("");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-muted pt-3 px-2 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          &larr; Payments
        </Button>
        <h2 className="text-xl font-bold text-orange-600">Top-Up Wallet</h2>
      </div>
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl animate-scale-in">
        <CardHeader>
          <CardTitle>Top Up</CardTitle>
          <CardDescription>Add funds to your wallet or card.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTopUp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Destination</label>
              <select
                className="w-full rounded-md p-2 border"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="wallet">Wallet Balance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <PaymentMethodPicker value={method} onChange={setMethod} label="Source Method" filterType="all" />
            <div>
              <label className="block text-xs">Note</label>
              <Input
                type="text"
                value={note}
                placeholder="Optional note"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs">Category</label>
                <select
                  className="w-full rounded-md p-2 border"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Top-Up</option>
                  <option>Cash</option>
                  <option>Savings</option>
                  <option>Promotion</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs">Tag</label>
                <select
                  className="w-full rounded-md p-2 border"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                >
                  <option value="">(None)</option>
                  <option value="bonus">Bonus</option>
                  <option value="gift">Gift</option>
                  <option value="salary">Salary</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full mt-3" disabled={loading}>
              {loading ? "Processing..." : "Top Up"}
            </Button>
          </form>
          {/* Recurring/Scheduled/FaceID Placeholder */}
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <strong>Coming soon:</strong> <span>Schedule/Recurring Top-Ups • FaceID Auth</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopUpWallet;
