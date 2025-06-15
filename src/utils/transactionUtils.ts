
import { supabase } from "@/integrations/supabase/client";

// Utility to add a transaction and update balances as needed
export async function createAndLogTransaction({
  userEmail,
  amount,
  transactionType, // 'income' | 'expense'
  name,
  category,
  date,
  sourceMethodId,
  recipientEmail,
  senderEmail,
  note,
  scheduledFor,
  tag,
}: {
  userEmail: string;
  amount: number;
  transactionType: "income" | "expense";
  name: string;
  category: string;
  date?: string;
  sourceMethodId?: string;
  recipientEmail?: string;
  senderEmail?: string;
  note?: string;
  scheduledFor?: string;
  tag?: string;
}) {
  // Insert transaction with explicit typing
  const { data: transactionData, error: transactionError } = await supabase.from("transactions").insert([{
    user_id: userEmail,
    amount,
    type: transactionType,
    name,
    category,
    date: date ? date : new Date().toISOString().slice(0,10),
    payment_method_id: sourceMethodId,
    recipient_user_id: recipientEmail,
    note,
    scheduled_for: scheduledFor,
  }]);

  // Update wallet if relevant
  if (!transactionError) {
    // Only update wallet for wallet-based transactions
    if (sourceMethodId) {
      // Fetch payment method to see if this is wallet with explicit typing
      const { data: paymentMethodData } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("id", sourceMethodId)
        .maybeSingle();
      
      const paymentMethod = paymentMethodData;
      if (paymentMethod && paymentMethod.type === "wallet") {
        // Find user's wallet with explicit typing
        let walletUserId = transactionType === "income"
          ? (recipientEmail || userEmail)
          : userEmail;
        
        const { data: walletData } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", walletUserId)
          .maybeSingle();
        
        const wallet = walletData;
        if (wallet) {
          const newBalance =
            transactionType === "income"
              ? Number(wallet.balance) + Number(amount)
              : Number(wallet.balance) - Number(amount);
              
          await supabase
            .from("wallets")
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", wallet.id);
        }
      }
    }
    return { success: true, error: null };
  }
  return { success: false, error: transactionError };
}
