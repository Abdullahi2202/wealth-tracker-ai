
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sampleCards = [
  {
    id: "card1",
    cardNumber: "4540 •••• •••• 1234",
    cardHolder: "DEMO USER",
    expiryDate: "12/26",
    bank: "National Bank",
    balance: 3250.75,
  },
  {
    id: "card2",
    cardNumber: "5412 •••• •••• 5678",
    cardHolder: "DEMO USER",
    expiryDate: "09/27",
    bank: "Metro Credit Union",
    balance: 1680.42,
  },
];

const SendPayment = () => {
  const [fromCard, setFromCard] = useState(sampleCards[0].id);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    const card = sampleCards.find((c) => c.id === fromCard);
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
    setTimeout(() => {
      toast.success(`Payment of $${amountValue.toFixed(2)} sent!`);
      setLoading(false);
      setAmount("");
      setRecipient("");
    }, 1200);
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
                {sampleCards.map((card) => (
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
