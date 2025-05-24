
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, CreditCard } from "lucide-react";
import { toast } from "sonner";

const wallets = [
  { id: "wallet", name: "Wallet Balance" },
  { id: "card1", name: "Card 1" },
  { id: "card2", name: "Card 2" },
];

const TopUpWallet = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("wallet");
  const [method, setMethod] = useState("bank");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!details) {
      toast.error("Enter account/card details.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success(`$${parseFloat(amount).toFixed(2)} added to ${destination}.`);
      setLoading(false);
      setAmount("");
      setDetails("");
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
                {wallets.map((wal) => (
                  <option key={wal.id} value={wal.id}>
                    {wal.name}
                  </option>
                ))}
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
            <div>
              <label className="block text-sm mb-1">Source Method</label>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  className={`rounded-lg flex items-center gap-1 p-2 border ${method === "bank" ? "bg-blue-100" : ""}`}
                  onClick={() => setMethod("bank")}
                >
                  <Building className="h-5 w-5" /> Bank
                </button>
                <button
                  type="button"
                  className={`rounded-lg flex items-center gap-1 p-2 border ${method === "card" ? "bg-orange-100" : ""}`}
                  onClick={() => setMethod("card")}
                >
                  <CreditCard className="h-5 w-5" /> Card
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">
                {method === "bank" ? "Bank Account Number" : "Card Number"}
              </label>
              <Input
                type="text"
                placeholder={method === "bank" ? "Enter account number" : "Enter card number"}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full mt-3" disabled={loading}>
              {loading ? "Processing..." : "Top Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopUpWallet;
