
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
  // Insert transaction
  const { data, error } = await supabase.from("transactions").insert([{
    email: userEmail,
    amount,
    type: transactionType,
    name,
    category,
    date: date ? date : new Date().toISOString().slice(0,10),
    source_method_id: sourceMethodId,
    recipient_email: recipientEmail,
    sender_email: senderEmail,
    note,
    scheduled_for: scheduledFor,
    tag,
  }]);

  // Update wallet if relevant
  if (!error) {
    // Only update wallet for wallet-based transactions
    if (sourceMethodId) {
      // Fetch payment method to see if this is wallet
      const pmRes = await supabase.from("payment_methods").select("*").eq("id", sourceMethodId).maybeSingle();
      const paymentMethod = pmRes.data;
      if (paymentMethod && paymentMethod.type === "wallet") {
        // Find user's wallet
        let walletEmail = transactionType === "income"
          ? (recipientEmail || userEmail)
          : userEmail;
        const walRes = await supabase.from("wallets").select("*").eq("user_email", walletEmail).maybeSingle();
        const wallet = walRes.data;
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
  return { success: false, error };
}
