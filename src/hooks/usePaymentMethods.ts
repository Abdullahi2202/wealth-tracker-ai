
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  details?: any;
  is_active: boolean;
  default_card?: boolean;
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      // Get current user email
      const storedUser = localStorage.getItem("walletmaster_user");
      let email = "";
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          email = userObj.email || "";
        } catch {}
      }

      if (!email) {
        setMethods([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_email", email)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payment methods:", error);
        setMethods([]);
      } else {
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

    // Set up real-time subscription for payment methods
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
      .channel("payment-methods-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_methods",
          filter: `user_email=eq.${email}`,
        },
        () => {
          fetchMethods();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    methods,
    loading,
    refetch: fetchMethods,
  };
}
