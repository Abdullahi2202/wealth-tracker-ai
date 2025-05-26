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
    // Fetch wallet for user, or create if doesn't exist
    let { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_email", email)
      .maybeSingle();
    if (error) {
      setWallet(null);
      setLoading(false);
      return;
    }
    // If wallet doesn't exist, create one
    if (!data) {
      const { data: created, error: err } = await supabase
        .from("wallets")
        .insert({
          user_email: email,
          balance: 0,
        })
        .select()
        .maybeSingle();
      if (err) {
        setWallet(null);
      } else {
        setWallet(created);
      }
      setLoading(false);
      return;
    }
    setWallet(data);
    setLoading(false);
  }, []);

  // Subscribe to real-time wallet balance changes
  useEffect(() => {
    fetchWallet(); // initial load
    // Listen to SUPABASE real-time wallet updates
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
      .channel("schema-db-changes")
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

  // Refetch utility and balanceUpdater
  const updateWalletBalance = useCallback(
    async (amountDelta: number) => {
      if (!wallet) return false;
      const { data, error } = await supabase
        .from("wallets")
        .update({
          balance: (Number(wallet.balance) + Number(amountDelta)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id)
        .select()
        .maybeSingle();
      if (!error && data) {
        setWallet(data);
        return true;
      }
      return false;
    },
    [wallet]
  );

  return {
    wallet,
    balance: wallet?.balance ?? 0,
    loading,
    refetch: fetchWallet,
    updateWalletBalance,
  };
}
