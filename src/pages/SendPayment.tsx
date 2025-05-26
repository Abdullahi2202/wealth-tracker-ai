import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

const CATEGORY_OPTIONS = [
  "Transfer", "Food", "Bills", "Shopping", "Transport", "Misc"
];

const TAG_OPTIONS = [
  "friends", "family", "business", "refund", "split"
];

const SendPayment = () => {
  const [fromMethod, setFromMethod] = useState<string>("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transfer");
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { methods } = usePaymentMethods();
  const navigate = useNavigate();

  // Set default method when available
  useEffect(() => {
    if (!fromMethod && methods.length > 0) setFromMethod(methods[0].id);
  }, [methods]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!recipient) {
      toast.error("Enter recipient card number or ID.");
      return;
    }
    if (!fromMethod) {
      toast.error("Choose a payment method.");
      return;
    }
    setLoading(true);
    const storedUser = localStorage.getItem("walletmaster_user");
    let email = "";
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        email = userObj.email || "";
      } catch { email = ""; }
    }
    await supabase.from("transactions").insert({
      amount: amountValue,
      type: "expense",
      name: "Manual Send",
      category,
      tag: tag || null,
      note: note || null,
      date: new Date().toISOString().split("T")[0],
      email,
      source_method_id: fromMethod || null,
      recipient_email: recipient,
    });
    setTimeout(() => {
      toast.success(`Payment of $${amountValue.toFixed(2)} sent!`);
      setLoading(false);
      setAmount("");
      setRecipient("");
      setNote("");
      setTag("");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted pt-3 px-2 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          &larr; Payments
        </Button>
        <h2 className="text-xl font-bold text-finance-blue">Send Payment</h2>
      </div>
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl animate-scale-in">
        <CardHeader>
          <CardTitle>Send Money</CardTitle>
          <CardDescription>Transfer money to another card instantly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-5">
            <PaymentMethodPicker value={fromMethod} onChange={setFromMethod} />
            <div>
              <label className="block text-sm mb-1">Recipient (Card/email/ID)</label>
              <Input
                type="text"
                placeholder="Enter recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Amount</label>
              <Input
                type="number"
                min={0}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                  {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
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
                  {TAG_OPTIONS.map((tagOpt) => <option key={tagOpt} value={tagOpt}>{tagOpt}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs">Note</label>
              <Input
                type="text"
                value={note}
                placeholder="Optional note"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}> {loading ? "Sending..." : "Send Payment"} </Button>
          </form>
          {/* Recurring/Scheduled/FaceID Placeholder */}
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <strong>Coming soon:</strong> <span>Schedule/Recurring Payments • FaceID Auth</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendPayment;
