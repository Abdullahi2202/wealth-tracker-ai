
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
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMethods([]);
        setLoading(false);
        return;
      }

      // Use any type to bypass TypeScript issues temporarily
      const { data, error } = await supabase
        .from("payment_methods" as any)
        .select("id, type, label, brand, exp_month, exp_year, last4, is_active, is_default, created_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payment methods:", error);
        setMethods([]);
      } else {
        setMethods((data || []) as PaymentMethod[]);
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
