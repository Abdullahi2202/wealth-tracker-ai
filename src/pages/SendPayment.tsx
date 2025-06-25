
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, Phone, ArrowLeft, CreditCard, QrCode, User, Building } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORY_OPTIONS = [
  "Transfer", "Food", "Bills", "Shopping", "Transport", "Entertainment", "Utilities", "Other"
];

const SendPayment = () => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transfer");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [transferType, setTransferType] = useState("user_to_user");
  
  // Bank transfer fields
  const [bankAccount, setBankAccount] = useState({
    account_number: "",
    routing_number: "",
    account_name: ""
  });
  
  // QR code fields
  const [qrData, setQrData] = useState({
    merchant_id: "",
    merchant_name: ""
  });

  const { sendPayment, wallet, balance, refetch } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    
    if (!amountValue || amountValue <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (balance < amountValue) {
      toast.error(`Insufficient wallet balance. Available: $${balance.toFixed(2)}`);
      return;
    }
    
    // Validate based on transfer type
    if (transferType === 'user_to_user') {
      if (!recipient.trim() || !isValidPhoneNumber(recipient)) {
        toast.error("Please enter a valid phone number");
        return;
      }
    } else if (transferType === 'bank_transfer') {
      if (!bankAccount.account_number || !bankAccount.routing_number) {
        toast.error("Please fill in all bank account details");
        return;
      }
    } else if (transferType === 'qr_payment') {
      if (!qrData.merchant_id) {
        toast.error("Please scan a valid QR code");
        return;
      }
    }
    
    setLoading(true);

    try {
      console.log('Processing transfer:', { 
        transferType, 
        recipient, 
        amount: amountValue, 
        note, 
        category,
        bankAccount,
        qrData
      });
      
      const success = await processTransfer(transferType, amountValue, note);
      
      if (success) {
        toast.success(`Transfer of $${amountValue.toFixed(2)} completed successfully!`);
        
        // Reset form
        setAmount("");
        setRecipient("");
        setNote("");
        setCategory("Transfer");
        setBankAccount({ account_number: "", routing_number: "", account_name: "" });
        setQrData({ merchant_id: "", merchant_name: "" });
        
        await refetch();
        
        setTimeout(() => {
          navigate("/payments");
        }, 2000);
      } else {
        toast.error("Failed to process transfer. Please try again.");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to process transfer. Please try again.");
    }
    
    setLoading(false);
  };

  const processTransfer = async (type: string, amountValue: number, note?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    let transferData: any = {
      amount: amountValue,
      description: note,
      transfer_type: type
    };

    switch (type) {
      case 'user_to_user':
        transferData.recipient_phone = recipient.trim();
        break;
      case 'bank_transfer':
        transferData.bank_account = bankAccount;
        break;
      case 'qr_payment':
        transferData.qr_code_data = qrData;
        break;
    }

    console.log('Sending transfer request:', transferData);

    const { data, error } = await supabase.functions.invoke('send-money', {
      body: transferData,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
    });

    if (error) throw error;
    return data?.success || false;
  };

  const isValidPhoneNumber = (value: string) => {
    return /^\+?[\d\s-()]+$/.test(value) && !value.includes('@');
  };

  const simulateQRScan = () => {
    // Simulate scanning a QR code
    setQrData({
      merchant_id: "MERCHANT_" + Math.random().toString(36).substr(2, 9),
      merchant_name: "Sample Restaurant"
    });
    toast.success("QR code scanned successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-4 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/payments")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Money Transfer</CardTitle>
            <CardDescription>
              Send money to users, banks, or make QR payments
            </CardDescription>
            
            {/* Wallet Balance Display */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Available Balance</span>
                <span className="text-lg font-bold text-blue-900">
                  ${balance.toFixed(2)}
                </span>
              </div>
              {wallet?.user_phone && (
                <div className="text-xs text-gray-600 mt-1">
                  Wallet: {wallet.user_phone}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={transferType} onValueChange={setTransferType}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="user_to_user" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  User
                </TabsTrigger>
                <TabsTrigger value="bank_transfer" className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Bank
                </TabsTrigger>
                <TabsTrigger value="qr_payment" className="flex items-center gap-1">
                  <QrCode className="h-4 w-4" />
                  QR
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSend} className="space-y-6 mt-6">
                <TabsContent value="user_to_user" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send To (Phone Number)
                    </label>
                    <div className="relative">
                      <Input
                        type="tel"
                        placeholder="Phone number (e.g., +1234567890)"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-10"
                      />
                      <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bank_transfer" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Account holder name"
                      value={bankAccount.account_name}
                      onChange={(e) => setBankAccount({...bankAccount, account_name: e.target.value})}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <Input
                      type="text"
                      placeholder="Bank account number"
                      value={bankAccount.account_number}
                      onChange={(e) => setBankAccount({...bankAccount, account_number: e.target.value})}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Routing Number
                    </label>
                    <Input
                      type="text"
                      placeholder="Bank routing number"
                      value={bankAccount.routing_number}
                      onChange={(e) => setBankAccount({...bankAccount, routing_number: e.target.value})}
                      required
                      disabled={loading}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="qr_payment" className="space-y-4">
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={simulateQRScan}
                      className="w-full h-20 border-dashed"
                      disabled={loading}
                    >
                      <QrCode className="h-8 w-8 mr-2" />
                      Scan QR Code
                    </Button>
                    {qrData.merchant_name && (
                      <div className="mt-2 text-sm text-green-600">
                        Merchant: {qrData.merchant_name}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    max={balance}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={loading}
                    className="text-lg"
                  />
                  {amount && parseFloat(amount) > balance && (
                    <p className="text-xs text-red-500 mt-1">
                      Amount exceeds available balance
                    </p>
                  )}
                </div>
                
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={loading}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                {/* Note Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <Input
                    type="text"
                    value={note}
                    placeholder="What's this payment for?"
                    onChange={(e) => setNote(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Send Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700" 
                  disabled={
                    loading || 
                    balance < parseFloat(amount || "0") || 
                    !amount ||
                    (transferType === 'user_to_user' && (!recipient.trim() || !isValidPhoneNumber(recipient))) ||
                    (transferType === 'bank_transfer' && (!bankAccount.account_number || !bankAccount.routing_number)) ||
                    (transferType === 'qr_payment' && !qrData.merchant_id)
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Send $${amount || '0.00'}`
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SendPayment;
