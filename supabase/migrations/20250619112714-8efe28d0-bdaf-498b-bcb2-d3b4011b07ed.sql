
-- Add the missing stripe_payment_method_id column to payment_methods table
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;

-- Create an index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id 
ON public.payment_methods(stripe_payment_method_id);

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Service role bypass payment_methods" ON public.payment_methods;

-- Create policy that allows users to manage their own payment methods
CREATE POLICY "Users can manage their own payment methods" 
ON public.payment_methods
FOR ALL USING (user_id = auth.uid());

-- Create policy that allows service role to bypass RLS
CREATE POLICY "Service role bypass payment_methods" 
ON public.payment_methods
FOR ALL TO service_role USING (true);
