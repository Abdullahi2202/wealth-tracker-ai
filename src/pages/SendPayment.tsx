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

const SendPayment = () => {
  const [cards, setCards] = useState<{ id: string; cardNumber: string; cardHolder: string; balance: number; bank: string; expiryDate: string }[]>([]);
  const [fromCard, setFromCard] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate fetching user's cards (replace with actual cards table later)
    const fetchCards = async () => {
      const storedUser = localStorage.getItem("walletmaster_user");
      let email = "";
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          email = userObj.email || "";
        } catch {
          email = "";
        }
      }
      // Demo: Just fetch the registration, present as wallet card for now
      const { data, error } = await supabase
        .from("registrations")
        .select("id, full_name, email")
        .eq("email", email)
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        const userCard = {
          id: "user-wallet",
          cardNumber: "•••• •••• •••• " + data.id?.slice(-4) || "0000",
          cardHolder: (data.full_name || "USER").toUpperCase(),
          bank: "WalletMaster",
          expiryDate: "12/30",
          balance: 0
        };
        setCards([userCard]);
        setFromCard(userCard.id);
      } else {
        setCards([]);
        setFromCard("");
      }
    };
    fetchCards();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    const card = cards.find((c) => c.id === fromCard);
    if (!amountValue || amountValue <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!recipient) {
      toast.error("Enter recipient card number.");
      return;
    }
    if (card && amountValue > card.balance) {
      toast.error("Insufficient funds.");
      return;
    }
    setLoading(true);
    // Save transaction to Supabase
    const storedUser = localStorage.getItem("walletmaster_user");
    let email = "";
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        email = userObj.email || "";
      } catch {
        email = "";
      }
    }
    await supabase.from("transactions").insert({
      id: undefined, // let supabase auto-gen
      email,
      amount: amountValue,
      type: "expense",
      name: "Manual Send", // You can customize
      category: "Transfer",
      date: new Date().toISOString().split("T")[0]
    });
    setTimeout(() => {
      toast.success(`Payment of $${amountValue.toFixed(2)} sent!`);
      setLoading(false);
      setAmount("");
      setRecipient("");
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
            <div>
              <label className="block text-sm mb-1">From</label>
              <select
                className="w-full rounded-md p-2 border"
                value={fromCard}
                onChange={(e) => setFromCard(e.target.value)}
              >
                {cards.map((card) => (
                  <option value={card.id} key={card.id}>
                    {card.bank} — {card.cardNumber} (${card.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Recipient Card</label>
              <Input
                type="text"
                placeholder="Enter card number"
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
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Sending..." : "Send Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendPayment;
