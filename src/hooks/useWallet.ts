
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      console.log('useWallet: Starting wallet fetch...');
      setError(null);
      
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

      let { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useWallet: Auth state changed:', { event, session: !!session });
      
      if (!session) {
        setWallet(null);
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchWallet();
      }
    });

    const initializeWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        fetchWallet();
        
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

  const sendPayment = useCallback(
    async (
      recipientPhone: string, 
      amount: number, 
      note?: string,
      transferType: 'user_to_user' | 'bank_transfer' | 'qr_payment' = 'user_to_user',
      additionalData?: any
    ) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        console.log('Sending payment:', { 
          recipientPhone, 
          amount, 
          transferType, 
          additionalData 
        });

        // Build request body properly
        const requestBody: any = {
          amount: Number(amount),
          description: note || '',
          transfer_type: transferType
        };

        // Add specific data based on transfer type
        switch (transferType) {
          case 'user_to_user':
            if (!recipientPhone || recipientPhone.includes('@')) {
              throw new Error('Valid phone number required for user transfers');
            }
            requestBody.recipient_phone = recipientPhone.trim();
            break;
          case 'bank_transfer':
            requestBody.bank_account = additionalData;
            break;
          case 'qr_payment':
            requestBody.qr_code_data = additionalData;
            break;
        }

        console.log('Final request body:', requestBody);

        const { data, error } = await supabase.functions.invoke('send-money', {
          body: requestBody
        });

        if (error) {
          console.error('Edge function error:', error);
          throw error;
        }
        
        console.log('Payment response:', data);
        
        if (data?.success) {
          await fetchWallet();
          return true;
        } else {
          throw new Error(data?.error || 'Payment failed');
        }
      } catch (error) {
        console.error("Error sending payment:", error);
        throw error;
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
