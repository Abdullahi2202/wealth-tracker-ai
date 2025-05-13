
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreditCard, ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PaymentGateway from "@/components/payments/PaymentGateway";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface CardOption {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  bank: string;
  balance: number;
  color?: string;
}

const sampleCards: CardOption[] = [
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

const paymentFormSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  cardId: z.string().min(1, "Please select a card"),
  recipientCard: z.string().min(16, "Card number must be 16 digits").max(19),
  note: z.string().optional(),
  gateway: z.string().min(1, "Please select a payment method"),
});

const receiveFormSchema = z.object({
  cardId: z.string().min(1, "Please select a card"),
});

const Payments = () => {
  const [cards] = useState<CardOption[]>(sampleCards);
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      cardId: "",
      recipientCard: "",
      note: "",
      gateway: "card",
    },
  });

  const receiveForm = useForm<z.infer<typeof receiveFormSchema>>({
    resolver: zodResolver(receiveFormSchema),
    defaultValues: {
      cardId: "",
    },
  });

  const onSendPayment = (values: z.infer<typeof paymentFormSchema>) => {
    const selectedCard = cards.find(card => card.id === values.cardId);
    const amount = parseFloat(values.amount);
    
    if (selectedCard && selectedCard.balance >= amount) {
      setIsProcessing(true);
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        toast.success(`$${amount.toFixed(2)} payment sent successfully!`);
        console.log("Payment details:", values);
        paymentForm.reset();
      }, 1500);
    } else {
      toast.error("Insufficient funds for this payment.");
    }
  };

  const viewReceivePayments = (values: z.infer<typeof receiveFormSchema>) => {
    const selectedCard = cards.find(card => card.id === values.cardId);
    
    if (selectedCard) {
      toast.success(`Viewing payments received on ${selectedCard.bank} card ending in ${selectedCard.cardNumber.slice(-4)}`);
    }
  };
  
  // Update form when gateway changes
  const handleGatewayChange = (gateway: string) => {
    setSelectedPaymentGateway(gateway);
    paymentForm.setValue("gateway", gateway);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payments</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {cards.map((card) => (
            <div key={card.id} className="flex flex-col h-full">
              <Card
                className={`credit-card h-48 group transform transition hover:-translate-y-1 hover:shadow-lg ${
                  card.color || "bg-gradient-to-r from-blue-500 to-blue-700"
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
        </div>

        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="send" className="flex gap-2 items-center">
              <CreditCard className="h-4 w-4" /> Send Payment
            </TabsTrigger>
            <TabsTrigger value="receive" className="flex gap-2 items-center">
              <Download className="h-4 w-4" /> Received Payments
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Send Money</CardTitle>
                <CardDescription>
                  Transfer money to another card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onSendPayment)} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="cardId"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>From</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-4"
                            >
                              {cards.map((card) => (
                                <div key={card.id} className="flex items-center space-x-2">
                                  <RadioGroupItem value={card.id} id={card.id} />
                                  <label
                                    htmlFor={card.id}
                                    className="flex items-center space-x-2 cursor-pointer w-full"
                                  >
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1">{card.bank} {card.cardNumber} </span>
                                    <span className="font-medium">${card.balance.toFixed(2)}</span>
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
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
                    
                    <PaymentGateway
                      selectedGateway={selectedPaymentGateway}
                      onGatewayChange={handleGatewayChange}
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

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Send Payment"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="receive">
            <Card>
              <CardHeader>
                <CardTitle>Received Payments</CardTitle>
                <CardDescription>
                  View payments received on your cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...receiveForm}>
                  <form onSubmit={receiveForm.handleSubmit(viewReceivePayments)} className="space-y-4">
                    <FormField
                      control={receiveForm.control}
                      name="cardId"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Select Card</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-4"
                            >
                              {cards.map((card) => (
                                <div key={card.id} className="flex items-center space-x-2">
                                  <RadioGroupItem value={card.id} id={`receive-${card.id}`} />
                                  <label
                                    htmlFor={`receive-${card.id}`}
                                    className="flex items-center space-x-2 cursor-pointer w-full"
                                  >
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span>{card.bank} {card.cardNumber}</span>
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="border border-border rounded-md p-4 bg-muted/30 mt-4">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">No payments received yet</p>
                        <p className="text-sm text-muted-foreground">Select a card to view received payments</p>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">View Payments</Button>
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
