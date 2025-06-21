
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useWalletNumber = () => {
  const [walletNumber, setWalletNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletNumber = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("User not authenticated");
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("wallets")
          .select("wallet_number")
          .eq("user_id", user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching wallet number:", fetchError);
          setError("Failed to fetch wallet number");
          return;
        }

        if (data && data.wallet_number) {
          setWalletNumber(data.wallet_number.toString());
        }
      } catch (err) {
        console.error("Exception fetching wallet number:", err);
        setError("Failed to fetch wallet number");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletNumber();
  }, []);

  return { walletNumber, loading, error };
};
