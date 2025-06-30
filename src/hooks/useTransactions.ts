
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  date: string;
  name: string;
  category?: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to fetch transactions');
        return;
      }

      const formattedTransactions: Transaction[] = (data || []).map(transaction => ({
        id: transaction.id,
        amount: Math.abs(transaction.amount),
        type: transaction.amount >= 0 ? 'income' : 'expense',
        date: transaction.created_at,
        name: transaction.description || 'Unknown Transaction',
        category: transaction.category || undefined
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions
  };
}
