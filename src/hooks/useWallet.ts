
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Wallet data type
export interface Wallet {
  id: string;
  user_email: string;
  balance: number;
  updated_at: string;
  user_id?: string;
}

/**
 * React hook for managing the authenticated user's wallet balance.
 * Keeps the wallet balance up-to-date, returns current wallet object, loading, and refetch utility.
 */
export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('No authenticated user found');
        setWallet(null);
        setLoading(false);
        return;
      }

      console.log('Fetching wallet for user:', user.email);

      // First try to get wallet from database directly
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();

      if (walletError) {
        console.error("Direct wallet fetch error:", walletError);
        // If direct fetch fails, try using the edge function
        const { data: functionData, error: functionError } = await supabase.functions.invoke('wallet-operations', {
          body: { action: 'get-balance' },
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (functionError) {
          console.error("Edge function wallet fetch error:", functionError);
          setWallet(null);
        } else {
          console.log('Wallet fetched via edge function:', functionData);
          setWallet(functionData);
        }
      } else {
        console.log('Wallet fetched directly:', walletData);
        setWallet(walletData);
      }
    } catch (error) {
      console.error("Error in fetchWallet:", error);
      setWallet(null);
    }
    setLoading(false);
  }, []);

  // Subscribe to real-time wallet balance changes
  useEffect(() => {
    fetchWallet(); // initial load
    
    const { data: { user } } = supabase.auth.getUser().then(({ data }) => {
      if (!data.user?.email) return;
      
      const channel = supabase
        .channel("wallet-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "wallets",
            filter: `user_email=eq.${data.user.email}`,
          },
          (payload) => {
            console.log('Real-time wallet update:', payload.new);
            if (payload.new) setWallet(payload.new as Wallet);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [fetchWallet]);

  // Add funds to wallet using edge function
  const addFunds = useCallback(
    async (amount: number, source?: string, description?: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('wallet-operations', {
          body: { action: 'add-funds', amount, source, description },
          headers: { 'Content-Type': 'application/json' },
        });

        if (error) throw error;
        
        setWallet(data);
        return true;
      } catch (error) {
        console.error("Error adding funds:", error);
        return false;
      }
    },
    []
  );

  // Send payment using edge function
  const sendPayment = useCallback(
    async (recipient: string, amount: number, note?: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('wallet-operations', {
          body: { action: 'send-payment', recipient, sendAmount: amount, note },
          headers: { 'Content-Type': 'application/json' },
        });

        if (error) throw error;
        
        await fetchWallet(); // Refresh wallet data
        return true;
      } catch (error) {
        console.error("Error sending payment:", error);
        return false;
      }
    },
    [fetchWallet]
  );

  return {
    wallet,
    balance: wallet?.balance ?? 0,
    loading,
    refetch: fetchWallet,
    addFunds,
    sendPayment,
  };
}
