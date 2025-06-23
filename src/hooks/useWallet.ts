
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Updated Wallet data type to include user_phone
export interface Wallet {
  id: string;
  user_email: string;
  user_phone?: string;
  balance: number;
  updated_at: string;
  user_id?: string;
  wallet_number?: number;
  currency?: string;
  created_at?: string;
  is_frozen?: boolean;
}

/**
 * React hook for managing the authenticated user's wallet balance.
 * Uses phone number as primary identifier with email as fallback.
 */
export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      console.log('useWallet: Starting wallet fetch...');
      setError(null);
      
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('useWallet: User authentication error:', userError);
        setError('Authentication failed');
        setWallet(null);
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.log('useWallet: No authenticated user found');
        setError('No authenticated user');
        setWallet(null);
        setLoading(false);
        return;
      }

      // Get user profile to find phone number
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('useWallet: Profile fetch error:', profileError);
      }

      const userPhone = profile?.phone;
      console.log('useWallet: User details:', { email: user.email, phone: userPhone });

      // First try to fetch wallet by user_id (most reliable)
      let { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If not found by user_id, try by phone or email
      if (!walletData && !walletError) {
        if (userPhone) {
          const { data: phoneWallet, error: phoneError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_phone', userPhone)
            .maybeSingle();
          
          walletData = phoneWallet;
          walletError = phoneError;
        }
        
        // If still not found, try by email
        if (!walletData && !walletError) {
          const { data: emailWallet, error: emailError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_email', user.email)
            .maybeSingle();
          
          walletData = emailWallet;
          walletError = emailError;
        }
      }

      if (walletError) {
        console.error("useWallet: Wallet fetch error:", walletError);
        setError('Failed to fetch wallet data');
        setWallet(null);
      } else if (walletData) {
        console.log('useWallet: Wallet fetched successfully:', {
          balance: walletData.balance,
          phone: walletData.user_phone,
          updated_at: walletData.updated_at
        });
        setWallet(walletData as Wallet);
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
          setError('Failed to create wallet');
          setWallet(null);
        } else {
          console.log('useWallet: New wallet created:', newWallet);
          setWallet(newWallet as Wallet);
        }
      }
    } catch (error) {
      console.error("useWallet: Error in fetchWallet:", error);
      setError('An unexpected error occurred');
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time wallet balance changes
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useWallet: Auth state changed:', { event, session: !!session });
      
      if (!session) {
        // User logged out, clear wallet data
        setWallet(null);
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      
      // User logged in or session restored, fetch wallet
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchWallet();
      }
    });

    // Initial session check and wallet fetch
    const initializeWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        fetchWallet();
        
        // Set up realtime subscription for authenticated users
        console.log('useWallet: Setting up realtime subscription for user:', session.user.id);
        
        const channel = supabase
          .channel("wallet-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "wallets",
              filter: `user_id=eq.${session.user.id}`,
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
      } else {
        setWallet(null);
        setError('Not authenticated');
        setLoading(false);
      }
    };

    initializeWallet();
    
    return () => subscription.unsubscribe();
  }, [fetchWallet]);

  // Send payment using phone number only (no email support)
  const sendPayment = useCallback(
    async (recipientPhone: string, amount: number, note?: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        // Validate phone number format
        if (!recipientPhone || recipientPhone.includes('@')) {
          throw new Error('Only phone numbers are supported for transfers');
        }

        console.log('Sending payment to phone:', recipientPhone, 'amount:', amount);

        const { data, error } = await supabase.functions.invoke('send-money', {
          body: { 
            recipient_phone: recipientPhone, // Phone only, no email
            recipient_email: null, // Explicitly set to null
            amount, 
            description: note 
          },
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
    error,
    refetch: fetchWallet,
    sendPayment,
  };
}
