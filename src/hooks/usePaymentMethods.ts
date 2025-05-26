
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Payment method type
export interface PaymentMethod {
  id: string;
  user_email: string;
  type: "wallet" | "bank" | "card" | "apple_pay" | "google_pay";
  details: any;
  label: string;
  is_active: boolean;
  created_at: string;
}

// Helper: Type guard for allowed payment method strings
function isPaymentMethodType(
  value: string
): value is PaymentMethod["type"] {
  return [
    "wallet",
    "bank",
    "card",
    "apple_pay",
    "google_pay",
  ].includes(value);
}

// Return array of methods, loading, and addMethod function
export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMethods = async () => {
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
        setMethods([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_email", email)
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error || !data) {
        setMethods([]);
      } else {
        // Type-safe mapping to PaymentMethod[]
        const validMethods: PaymentMethod[] = data
          .filter((item) => isPaymentMethodType(item.type))
          .map((item) => ({
            ...item,
            type: item.type as PaymentMethod["type"],
          }));
        setMethods(validMethods);
      }
      setLoading(false);
    };
    fetchMethods();
  }, []);

  // Add new payment method
  async function addNewMethod(newMethod: Omit<PaymentMethod, "id" | "created_at" | "user_email" | "is_active">) {
    const storedUser = localStorage.getItem("walletmaster_user");
    let email = "";
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        email = userObj.email || "";
      } catch {}
    }
    if (!email) {
      throw new Error("No user found!");
    }
    const { data, error } = await supabase.from("payment_methods").insert({
      ...newMethod,
      user_email: email,
      is_active: true,
    });
    if (error) {
      throw error;
    }
    // Refetch after adding
    setTimeout(() => {
      // Wait a moment for DB write
      window.location.reload();
    }, 600);
  }

  return { methods, loading, addNewMethod };
}
