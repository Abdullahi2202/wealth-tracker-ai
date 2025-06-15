
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, MoreVertical, Trash2, Edit } from "lucide-react";
import { AddCardDrawer } from "@/components/payments/AddCardDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  is_active: boolean;
  label?: string;
  created_at: string;
}

const CardsList = () => {
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  const { data: paymentMethods, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      console.log('Fetching payment methods...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return [];
      }

      console.log('Current user:', user.id);

      // First check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error checking user:', userError);
        throw userError;
      }

      if (!userData) {
        console.log('User not found in users table, creating...');
        // Create user record if it doesn't exist
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email || ''
          });

        if (insertError) {
          console.error('Error creating user:', insertError);
          throw insertError;
        }
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }

      console.log('Payment methods fetched:', data);
      return data as PaymentMethod[];
    },
  });

  const deletePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', paymentMethodId);

      if (error) throw error;

      toast.success('Payment method removed successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to remove payment method');
    }
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // First, unset all other default payment methods for this user
      const { error: unsetError } = await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (unsetError) throw unsetError;

      // Then set the selected one as default
      const { error: setError } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (setError) throw setError;

      toast.success('Default payment method updated');
      refetch();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('Failed to update default payment method');
    }
  };

  const getCardIcon = (brand?: string) => {
    // You can add more specific brand icons here
    return <CreditCard className="h-6 w-6" />;
  };

  const getCardColor = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'from-blue-500 to-blue-700';
      case 'mastercard':
        return 'from-red-500 to-red-700';
      case 'amex':
        return 'from-green-500 to-green-700';
      case 'discover':
        return 'from-orange-500 to-orange-700';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Payment Methods</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your payment methods...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Payment Methods</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">Error loading payment methods. Please try again.</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <Button onClick={() => setIsAddCardOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {paymentMethods && paymentMethods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="overflow-hidden">
              <div className={`h-32 bg-gradient-to-r ${getCardColor(method.brand)} p-4 text-white relative`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    {getCardIcon(method.brand)}
                    <span className="text-lg font-semibold capitalize">
                      {method.brand || method.type}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setDefaultPaymentMethod(method.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deletePaymentMethod(method.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4">
                  <p className="text-xl font-mono">
                    •••• •••• •••• {method.last4}
                  </p>
                  {method.exp_month && method.exp_year && (
                    <p className="text-sm opacity-80">
                      {String(method.exp_month).padStart(2, '0')}/{String(method.exp_year).slice(-2)}
                    </p>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{method.label || `${method.brand} Card`}</p>
                    <p className="text-sm text-muted-foreground">
                      Added {new Date(method.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {method.is_default && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No payment methods</h3>
            <p className="text-muted-foreground mb-4">
              Add a payment method to start making transactions
            </p>
            <Button onClick={() => setIsAddCardOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </Button>
          </CardContent>
        </Card>
      )}

      <AddCardDrawer 
        open={isAddCardOpen} 
        onOpenChange={setIsAddCardOpen}
        onSuccess={() => {
          refetch();
          setIsAddCardOpen(false);
        }}
      />
    </div>
  );
};

export default CardsList;
