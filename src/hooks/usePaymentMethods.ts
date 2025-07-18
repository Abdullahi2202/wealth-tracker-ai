
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentMethod {
  id: string;
  type: string;
  label?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  last4?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      console.log('Fetching payment methods...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User auth error:', userError);
        setMethods([]);
        setLoading(false);
        return;
      }

      if (!user) {
        console.log('No authenticated user found');
        setMethods([]);
        setLoading(false);
        return;
      }

      console.log('Current user:', user.id);

      // Fetch payment methods with proper typing
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, type, label, brand, exp_month, exp_year, last4, is_active, is_default, created_at, updated_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payment methods:", error);
        setMethods([]);
      } else {
        console.log('Payment methods fetched:', data);
        setMethods(data || []);
      }
    } catch (error) {
      console.error("Error in fetchMethods:", error);
      setMethods([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  return {
    methods,
    loading,
    refetch: fetchMethods,
  };
}
