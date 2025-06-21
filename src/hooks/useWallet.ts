
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

      // Fetch wallet from database directly
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();

      if (walletError) {
        console.error("Wallet fetch error:", walletError);
        setWallet(null);
      } else if (walletData) {
        console.log('Wallet fetched successfully:', walletData);
        setWallet(walletData);
      } else {
        console.log('No wallet found for user, creating one...');
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            user_email: user.email,
            balance: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          setWallet(null);
        } else {
          console.log('New wallet created:', newWallet);
          setWallet(newWallet);
        }
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
    
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      
      const channel = supabase
        .channel("wallet-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "wallets",
            filter: `user_email=eq.${user.email}`,
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
    };

    setupRealtime();
  }, [fetchWallet]);

  // Add funds to wallet using edge function
  const addFunds = useCallback(
    async (amount: number, source?: string, description?: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const { data, error } = await supabase.functions.invoke('wallet-operations', {
          body: JSON.stringify({ action: 'add-funds', amount, source, description }),
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const { data, error } = await supabase.functions.invoke('wallet-operations', {
          body: JSON.stringify({ action: 'send-payment', recipient, sendAmount: amount, note }),
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
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
