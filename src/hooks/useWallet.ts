
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Wallet data type
export interface Wallet {
  id: string;
  user_email: string;
  user_phone?: string;
  balance: number;
  updated_at: string;
  user_id?: string;
  wallet_number?: number;
}

/**
 * React hook for managing the authenticated user's wallet balance.
 * Uses phone number as primary identifier with email as fallback.
 */
export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      console.log('useWallet: Starting wallet fetch...');
      
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('useWallet: No authenticated user found');
        setWallet(null);
        setLoading(false);
        return;
      }

      // Get user profile to find phone number
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      const userPhone = profile?.phone;
      console.log('useWallet: User details:', { email: user.email, phone: userPhone });

      // Try to fetch wallet by phone first, then by email
      let walletQuery = supabase.from('wallets').select('*');
      
      if (userPhone) {
        walletQuery = walletQuery.eq('user_phone', userPhone);
      } else {
        walletQuery = walletQuery.eq('user_email', user.email);
      }

      const { data: walletData, error: walletError } = await walletQuery.maybeSingle();

      if (walletError) {
        console.error("useWallet: Wallet fetch error:", walletError);
        setWallet(null);
      } else if (walletData) {
        console.log('useWallet: Wallet fetched successfully:', {
          balance: walletData.balance,
          phone: walletData.user_phone,
          updated_at: walletData.updated_at
        });
        setWallet(walletData);
      } else {
        console.log('useWallet: No wallet found, creating one...');
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            user_email: user.email,
            user_phone: userPhone,
            balance: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('useWallet: Error creating wallet:', createError);
          setWallet(null);
        } else {
          console.log('useWallet: New wallet created:', newWallet);
          setWallet(newWallet);
        }
      }
    } catch (error) {
      console.error("useWallet: Error in fetchWallet:", error);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time wallet balance changes
  useEffect(() => {
    fetchWallet(); // initial load
    
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      const userPhone = profile?.phone;
      
      console.log('useWallet: Setting up realtime subscription for:', { email: user.email, phone: userPhone });
      
      const channel = supabase
        .channel("wallet-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "wallets",
            filter: userPhone ? `user_phone=eq.${userPhone}` : `user_email=eq.${user.email}`,
          },
          (payload) => {
            console.log('useWallet: Real-time wallet update received:', payload);
            if (payload.new) {
              console.log('useWallet: Updating wallet state with new data:', payload.new);
              setWallet(payload.new as Wallet);
            }
          }
        )
        .subscribe((status) => {
          console.log('useWallet: Realtime subscription status:', status);
        });
        
      return () => {
        console.log('useWallet: Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, [fetchWallet]);

  // Send payment using phone number or email
  const sendPayment = useCallback(
    async (recipientIdentifier: string, amount: number, note?: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        console.log('Sending payment to:', recipientIdentifier, 'amount:', amount);

        const { data, error } = await supabase.functions.invoke('send-money', {
          body: JSON.stringify({ 
            recipient_phone: recipientIdentifier.includes('@') ? null : recipientIdentifier,
            recipient_email: recipientIdentifier.includes('@') ? recipientIdentifier : null,
            amount, 
            description: note 
          }),
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
    sendPayment,
  };
}
