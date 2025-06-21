
-- First, let's ensure we have a proper payment_methods table structure
-- Check if we need to add any missing columns or update the existing table

-- Update the payment_methods table to ensure all necessary columns exist
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create an index for better performance on Stripe customer ID lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_customer_id 
ON public.payment_methods(stripe_customer_id);

-- Create an index for better performance on user lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id 
ON public.payment_methods(user_id);

-- Update RLS policies to ensure proper access control
DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Service role bypass payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can view all payment methods" ON public.payment_methods;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment methods" 
ON public.payment_methods
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payment methods" 
ON public.payment_methods
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own payment methods" 
ON public.payment_methods
FOR DELETE 
USING (user_id = auth.uid());

-- Service role policy for backend operations
CREATE POLICY "Service role can manage all payment methods" 
ON public.payment_methods
FOR ALL 
TO service_role 
USING (true);

-- Admin policy for administrative access
CREATE POLICY "Admins can view all payment methods" 
ON public.payment_methods
FOR SELECT 
USING (public.is_admin());

-- Ensure RLS is enabled
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_payment_methods_updated_at_trigger ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at_trigger
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_methods_updated_at();
