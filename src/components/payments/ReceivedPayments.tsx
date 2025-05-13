
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PaymentData {
  id: string;
  sender: string;
  amount: number;
  date: string;
  cardId: string;
  description: string;
}

// Sample data - in a real app, this would come from an API
const samplePayments: PaymentData[] = [
  {
    id: "pay1",
    sender: "John Doe",
    amount: 250.00,
    date: "2025-05-10",
    cardId: "card1",
    description: "Rent payment"
  },
  {
    id: "pay2",
    sender: "Sarah Wilson",
    amount: 125.50,
    date: "2025-05-08",
    cardId: "card1",
    description: "Dinner share"
  },
  {
    id: "pay3",
    sender: "Michael Brown",
    amount: 75.00,
    date: "2025-05-05",
    cardId: "card2",
    description: "Movie tickets"
  },
  {
    id: "pay4",
    sender: "Emma Johnson",
    amount: 350.00,
    date: "2025-05-03",
    cardId: "card2",
    description: "Trip expenses"
  }
];

interface ReceivedPaymentsProps {
  cardId: string;
  onBack: () => void;
}

const ReceivedPayments = ({ cardId, onBack }: ReceivedPaymentsProps) => {
  const [payments] = useState<PaymentData[]>(
    samplePayments.filter(payment => payment.cardId === cardId)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold">Received Payments</h2>
      </div>
      
      {payments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(payment => (
              <TableRow key={payment.id}>
                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                <TableCell>{payment.sender}</TableCell>
                <TableCell>{payment.description}</TableCell>
                <TableCell className="text-right font-medium">
                  ${payment.amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="border border-border rounded-md p-8 bg-muted/30 text-center">
          <p className="text-muted-foreground">No payments received for this card</p>
        </div>
      )}
    </div>
  );
};

export default ReceivedPayments;
