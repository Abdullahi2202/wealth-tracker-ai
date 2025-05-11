
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

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
  const [cards, setCards] = useState<CreditCardData[]>(sampleCards);

  const addNewCard = () => {
    toast.info("Card linking feature will be available soon!");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id} className="flex flex-col h-full">
            <Card
              className={`credit-card h-48 group transform transition hover:-translate-y-1 hover:shadow-lg ${
                card.color || ""
              }`}
            >
              <CardContent className="p-6 flex flex-col h-full justify-between text-white">
                <div className="flex justify-between items-start">
                  <div className="text-white/80 font-medium">{card.bank}</div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="32"
                    viewBox="0 0 40 32"
                    className="opacity-80"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M25.5 11C26.3284 11 27 10.3284 27 9.5C27 8.67157 26.3284 8 25.5 8C24.6716 8 24 8.67157 24 9.5C24 10.3284 24.6716 11 25.5 11ZM31.5 8C30.6716 8 30 8.67157 30 9.5C30 10.3284 30.6716 11 31.5 11C32.3284 11 33 10.3284 33 9.5C33 8.67157 32.3284 8 31.5 8Z"
                      fill="white"
                    />
                  </svg>
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
        ))}

        <Button
          onClick={addNewCard}
          className="h-48 border-2 border-dashed border-muted-foreground/20 bg-transparent hover:border-primary hover:bg-primary/5 flex flex-col gap-2 rounded-2xl"
          variant="ghost"
        >
          <PlusCircle className="h-10 w-10 text-muted-foreground" />
          <span>Link New Card</span>
        </Button>
      </div>
    </div>
  );
};

export default CardsList;
