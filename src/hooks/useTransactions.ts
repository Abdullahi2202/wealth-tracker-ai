
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  date: string;
  name: string;
  category?: string;
  status?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        return;
      }

      console.log('Fetching transactions for user:', user.id);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to fetch transactions');
        return;
      }

      console.log('Fetched transactions:', data?.length || 0);

      const formattedTransactions: Transaction[] = (data || []).map(transaction => ({
        id: transaction.id,
        amount: Math.abs(Number(transaction.amount)),
        type: transaction.type || (Number(transaction.amount) >= 0 ? 'income' : 'expense'),
        date: transaction.date || transaction.created_at,
        name: transaction.name || 'Unknown Transaction',
        category: transaction.category || undefined,
        status: transaction.status || 'completed',
        note: transaction.note || undefined,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transactionData: {
    name: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    category?: string;
    note?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: transactionData.name,
          amount: transactionData.amount,
          type: transactionData.type,
          category: transactionData.category,
          note: transactionData.note,
          status: 'pending' // New transactions start as pending for admin approval
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh transactions after creating
      await fetchTransactions();
      
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransaction
  };
}
