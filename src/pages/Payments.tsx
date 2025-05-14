
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
import { CreditCard, ArrowRight, Download, Plus, ArrowDown, Wallet, Building } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PaymentGateway from "@/components/payments/PaymentGateway";
import ReceivedPayments from "@/components/payments/ReceivedPayments";

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

const utilityOptions = [
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "gas", label: "Gas" },
  { value: "internet", label: "Internet" },
  { value: "phone", label: "Phone" },
  { value: "other", label: "Other" }
];

const paymentFormSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  cardId: z.string().min(1, "Please select a card"),
  recipientCard: z.string().min(16, "Card number must be 16 digits").max(19),
  utilityType: z.string().min(1, "Please select a utility type"),
  note: z.string().optional(),
  gateway: z.string().min(1, "Please select a payment method"),
});

const receiveFormSchema = z.object({
  cardId: z.string().min(1, "Please select a card"),
});

const topUpFormSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  destinationId: z.string().min(1, "Please select where to add funds"),
  sourceType: z.enum(["bank", "debit"]),
  sourceDetails: z.string().min(1, "Please enter source details"),
});

const Payments = () => {
  const [cards] = useState<CardOption[]>(sampleCards);
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState("credit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceivedPayments, setShowReceivedPayments] = useState(false);
  const [selectedCardForPayments, setSelectedCardForPayments] = useState("");
  const [selectedUtilityType, setSelectedUtilityType] = useState("");
  const [isOtherUtility, setIsOtherUtility] = useState(false);
  const [selectedTopUpSource, setSelectedTopUpSource] = useState<"bank" | "debit">("bank");
  
  // Search params handling for direct tab navigation
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'send');
  
  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      cardId: "",
      recipientCard: "",
      utilityType: "",
      note: "",
      gateway: "credit",
    },
  });

  const receiveForm = useForm<z.infer<typeof receiveFormSchema>>({
    resolver: zodResolver(receiveFormSchema),
    defaultValues: {
      cardId: "",
    },
  });

  const topUpForm = useForm<z.infer<typeof topUpFormSchema>>({
    resolver: zodResolver(topUpFormSchema),
    defaultValues: {
      amount: "",
      destinationId: "",
      sourceType: "bank",
      sourceDetails: "",
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
      setSelectedCardForPayments(values.cardId);
      setShowReceivedPayments(true);
    }
  };

  const onTopUp = (values: z.infer<typeof topUpFormSchema>) => {
    const amount = parseFloat(values.amount);
    
    setIsProcessing(true);
    // Simulate top up processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`$${amount.toFixed(2)} added to your account successfully!`);
      console.log("Top up details:", values);
      topUpForm.reset();
    }, 1500);
  };
  
  // Update form when gateway changes
  const handleGatewayChange = (gateway: string) => {
    setSelectedPaymentGateway(gateway);
    paymentForm.setValue("gateway", gateway);
  };

  // Handle utility type change
  const handleUtilityTypeChange = (value: string) => {
    setSelectedUtilityType(value);
    paymentForm.setValue("utilityType", value);
    setIsOtherUtility(value === "other");
  };

  // Handle top up source change
  const handleTopUpSourceChange = (value: "bank" | "debit") => {
    setSelectedTopUpSource(value);
    topUpForm.setValue("sourceType", value);
  };

  const handleBackFromReceivedPayments = () => {
    setShowReceivedPayments(false);
    setSelectedCardForPayments("");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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

        {showReceivedPayments ? (
          <ReceivedPayments 
            cardId={selectedCardForPayments} 
            onBack={handleBackFromReceivedPayments} 
          />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="send" className="flex gap-2 items-center">
                <CreditCard className="h-4 w-4" /> Send Payment
              </TabsTrigger>
              <TabsTrigger value="topup" className="flex gap-2 items-center">
                <Plus className="h-4 w-4" /> Top Up
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
                        name="utilityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Utility Type</FormLabel>
                            <Select 
                              onValueChange={(value) => handleUtilityTypeChange(value)}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select utility type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {utilityOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isOtherUtility && (
                        <FormField
                          control={paymentForm.control}
                          name="note"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Details</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Please specify utility details..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

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
            
            <TabsContent value="topup">
              <Card>
                <CardHeader>
                  <CardTitle>Top Up</CardTitle>
                  <CardDescription>
                    Add funds to your wallet or cards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...topUpForm}>
                    <form onSubmit={topUpForm.handleSubmit(onTopUp)} className="space-y-4">
                      <FormField
                        control={topUpForm.control}
                        name="destinationId"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Destination</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 gap-4"
                              >
                                {cards.map((card) => (
                                  <div key={card.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={card.id} id={`topup-${card.id}`} />
                                    <label
                                      htmlFor={`topup-${card.id}`}
                                      className="flex items-center space-x-2 cursor-pointer w-full"
                                    >
                                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                                      <span>{card.bank} {card.cardNumber}</span>
                                    </label>
                                  </div>
                                ))}
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="wallet" id="topup-wallet" />
                                  <label
                                    htmlFor="topup-wallet"
                                    className="flex items-center space-x-2 cursor-pointer w-full"
                                  >
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <span>Wallet Balance</span>
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={topUpForm.control}
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
                        control={topUpForm.control}
                        name="sourceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => handleTopUpSourceChange(value as "bank" | "debit")}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="bank" id="source-bank" />
                                  <label
                                    htmlFor="source-bank"
                                    className="flex items-center space-x-2 cursor-pointer"
                                  >
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>Bank Account</span>
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="debit" id="source-debit" />
                                  <label
                                    htmlFor="source-debit"
                                    className="flex items-center space-x-2 cursor-pointer"
                                  >
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span>Debit Card</span>
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={topUpForm.control}
                        name="sourceDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {selectedTopUpSource === "bank" ? "Bank Account Number" : "Card Number"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={selectedTopUpSource === "bank" ? "Enter account number" : "Enter card number"} 
                                {...field} 
                              />
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
                        {isProcessing ? "Processing..." : "Top Up"}
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
                    View payments received in your wallet or from bank transfers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Money can only be received into your wallet balance or directly from bank transfers. 
                    Cards cannot directly receive payments.
                  </p>
                  
                  <Form {...receiveForm}>
                    <form onSubmit={receiveForm.handleSubmit(viewReceivePayments)} className="space-y-4">
                      <FormField
                        control={receiveForm.control}
                        name="cardId"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Select Account</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="wallet" id="receive-wallet" />
                                  <label
                                    htmlFor="receive-wallet"
                                    className="flex items-center space-x-2 cursor-pointer w-full"
                                  >
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <span>Wallet Balance</span>
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="bank" id="receive-bank" />
                                  <label
                                    htmlFor="receive-bank"
                                    className="flex items-center space-x-2 cursor-pointer w-full"
                                  >
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>Bank Transfers</span>
                                  </label>
                                </div>
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

                      <Button type="submit" className="w-full">View Payments</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Payments;
