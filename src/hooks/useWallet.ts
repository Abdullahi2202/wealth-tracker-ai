
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Wallet data type
export interface Wallet {
  id: string;
  user_email: string;
  balance: number;
  updated_at: string;
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
      const storedUser = localStorage.getItem("walletmaster_user");
      let email = "";
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          email = userObj.email || "";
        } catch {}
      }
      
      if (!email) {
        setWallet(null);
        setLoading(false);
        return;
      }

      // Use the wallet-operations edge function to get balance
      const { data, error } = await supabase.functions.invoke('wallet-operations', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json',
        },
      }, {
        method: 'GET',
        params: { action: 'get-balance' }
      });

      if (error) {
        console.error("Error fetching wallet:", error);
        setWallet(null);
      } else {
        setWallet(data);
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
    
    const storedUser = localStorage.getItem("walletmaster_user");
    let email = "";
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        email = userObj.email || "";
      } catch {}
    }
    
    if (!email) return;
    
    const channel = supabase
      .channel("wallet-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `user_email=eq.${email}`,
        },
        (payload) => {
          if (payload.new) setWallet(payload.new as Wallet);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWallet]);

  // Add funds to wallet using edge function
  const addFunds = useCallback(
    async (amount: number, source?: string, description?: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('wallet-operations', {
          body: { amount, source, description },
          headers: { 'Content-Type': 'application/json' },
        }, {
          method: 'POST',
          params: { action: 'add-funds' }
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
          body: { recipient, sendAmount: amount, note },
          headers: { 'Content-Type': 'application/json' },
        }, {
          method: 'POST',
          params: { action: 'send-payment' }
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
