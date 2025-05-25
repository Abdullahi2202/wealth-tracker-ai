import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CreditCardData {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  bank: string;
  balance: number;
  color?: string;
}

const sampleCards: CreditCardData[] = [
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
    color: "bg-gradient-to-r from-purple-500 to-indigo-600",
  },
];

const CardsList = () => {
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch real user cards data from supabase
    const fetchCards = async () => {
      setLoading(true);
      // Get user info from localStorage (as across the app)
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
      if (!email) {
        setCards([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("registrations")
        .select("id, full_name, email")
        .eq("email", email)
        .limit(1)
        .maybeSingle();
      // In a real app, you'd store/fetch list of cards from a "cards" table belonging to the user
      if (!error && data) {
        // For illustration, simulate a minimal credit card using registration data
        setCards([
          {
            id: "user-wallet",
            cardNumber: "•••• •••• •••• " + data.id?.slice(-4) || "0000",
            cardHolder: (data.full_name || "USER").toUpperCase(),
            expiryDate: "12/30",
            bank: "WalletMaster",
            balance: 0, // could fetch from transactions balance
            color: "bg-gradient-to-r from-purple-500 to-blue-500"
          }
        ]);
      } else {
        setCards([]);
      }
      setLoading(false);
    };
    fetchCards();
  }, []);

  const addNewCard = () => {
    // Could open a modal to add a real bank/card integration
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : cards.length === 0 ? (
          <div className="text-center text-muted-foreground col-span-2">
            No cards found. Add one!
          </div>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="flex flex-col h-full">
              <Card className={`credit-card h-48 group transform transition hover:-translate-y-1 hover:shadow-lg ${card.color || ""}`}>
                <CardContent className="p-6 flex flex-col h-full justify-between text-white">
                  <div className="flex justify-between items-start">
                    <div className="text-white/80 font-medium">{card.bank}</div>
                    {/* Bank logo can be added here */}
                  </div>
                  <div className="mt-4 text-lg tracking-widest font-mono">
                    {card.cardNumber}
                  </div>
                  <div className="flex justify-between items-end mt-6">
                    <div className="text-sm space-y-1">
                      <div className="text-white/70 uppercase text-xs">
                        Card Holder
                      </div>
                      <div>{card.cardHolder}</div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="text-white/70 uppercase text-xs">
                        Expires
                      </div>
                      <div>{card.expiryDate}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="font-semibold text-xl">
                  ${card.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))
        )}

        <Button
          onClick={addNewCard}
          className="h-48 border-2 border-dashed border-muted-foreground/20 bg-transparent hover:border-primary hover:bg-primary/5 flex flex-col gap-2 rounded-2xl"
          variant="ghost"
        >
          <span>Link New Card</span>
        </Button>
      </div>
    </div>
  );
};

export default CardsList;
