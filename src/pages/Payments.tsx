
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreditCard, ArrowRight, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface CardOption {
  id: string;
  cardNumber: string;
  bank: string;
  balance: number;
}

const sampleCards: CardOption[] = [
  {
    id: "card1",
    cardNumber: "4540 •••• •••• 1234",
    bank: "National Bank",
    balance: 3250.75,
  },
  {
    id: "card2",
    cardNumber: "5412 •••• •••• 5678",
    bank: "Metro Credit Union",
    balance: 1680.42,
  },
];

const paymentFormSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  cardId: z.string().min(1, "Please select a card"),
  recipientCard: z.string().min(16, "Card number must be 16 digits").max(19),
  note: z.string().optional(),
});

const requestFormSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  cardId: z.string().min(1, "Please select a card"),
  senderCard: z.string().min(16, "Card number must be 16 digits").max(19),
  note: z.string().optional(),
});

const Payments = () => {
  const [cards] = useState<CardOption[]>(sampleCards);
  
  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      cardId: "",
      recipientCard: "",
      note: "",
    },
  });

  const requestForm = useForm<z.infer<typeof requestFormSchema>>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      amount: "",
      cardId: "",
      senderCard: "",
      note: "",
    },
  });

  const onSendPayment = (values: z.infer<typeof paymentFormSchema>) => {
    const selectedCard = cards.find(card => card.id === values.cardId);
    const amount = parseFloat(values.amount);
    
    if (selectedCard && selectedCard.balance >= amount) {
      toast.success(`$${amount.toFixed(2)} payment sent successfully!`);
      console.log("Payment details:", values);
    } else {
      toast.error("Insufficient funds for this payment.");
    }
  };

  const onRequestPayment = (values: z.infer<typeof requestFormSchema>) => {
    toast.success(`Payment request for $${parseFloat(values.amount).toFixed(2)} sent successfully!`);
    console.log("Payment request details:", values);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payments</h1>

        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="send" className="flex gap-2 items-center">
              <ArrowRight className="h-4 w-4" /> Send Payment
            </TabsTrigger>
            <TabsTrigger value="request" className="flex gap-2 items-center">
              <ArrowDown className="h-4 w-4" /> Request Payment
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Send Money</CardTitle>
                <CardDescription>
                  Transfer money to another card or bank account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onSendPayment)} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="cardId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a card" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cards.map((card) => (
                                <SelectItem key={card.id} value={card.id} className="flex items-center">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span>{card.bank} {card.cardNumber} (${card.balance.toFixed(2)})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="recipientCard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input placeholder="Card number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5">$</span>
                              <Input className="pl-7" placeholder="0.00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Add a note" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">Send Payment</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="request">
            <Card>
              <CardHeader>
                <CardTitle>Request Money</CardTitle>
                <CardDescription>
                  Request a payment from someone to your card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...requestForm}>
                  <form onSubmit={requestForm.handleSubmit(onRequestPayment)} className="space-y-4">
                    <FormField
                      control={requestForm.control}
                      name="cardId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receive to</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a card" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cards.map((card) => (
                                <SelectItem key={card.id} value={card.id}>
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span>{card.bank} {card.cardNumber}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={requestForm.control}
                      name="senderCard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Request from (Card Number)</FormLabel>
                          <FormControl>
                            <Input placeholder="Card number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={requestForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5">$</span>
                              <Input className="pl-7" placeholder="0.00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={requestForm.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Add a note" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">Request Payment</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
