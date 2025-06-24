
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TopUpFormProps {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export const TopUpForm = ({ loading, onLoadingChange }: TopUpFormProps) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (!amount || amountValue < 1) {
      return;
    }

    onLoadingChange(true);
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No valid session found");
      }

      const topupDetails = {
        amount: amountValue,
        payment_method_id: '' // Direct payment without existing payment method
      };

      console.log("Sending topup request with details:", topupDetails);

      const response = await fetch('https://cbhtifqmlkdoevxmbjmm.supabase.co/functions/v1/create-topup-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiaHRpZnFtbGtkb2V2eG1iam1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTY3MjYsImV4cCI6MjA2Mjg3MjcyNn0.USk2Wi_HbcfFni8TTyZMqAjdbGC3eVIvqZvWm5dq_i8',
        },
        body: JSON.stringify(topupDetails),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error(`HTTP error! status: ${response.status}`, errorBody);
        throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Topup session created:", data);

      if (!data?.success || !data?.checkout_url) {
        throw new Error(data?.error || 'Failed to create payment session');
      }

      // Open Stripe checkout in a new tab
      const newWindow = window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        toast.error('Please allow popups to complete payment');
        return;
      }

      // Show success message
      toast.success('Redirecting to Stripe checkout...');
      
      // Clear the form
      setAmount("");

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-700">
            Top-up Amount ($)
          </label>
          <Input
            type="number"
            placeholder="Enter amount (e.g., 50.00)"
            min="1.00"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={loading}
            className="text-lg h-12"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum amount: $1.00 • Powered by Stripe
          </p>
        </div>
        
        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700" 
            disabled={loading || !amount || parseFloat(amount) < 1}
          >
            {loading ? 'Processing...' : 'Pay with Stripe'}
          </Button>
        </div>
      </form>
    </div>
  );
};
