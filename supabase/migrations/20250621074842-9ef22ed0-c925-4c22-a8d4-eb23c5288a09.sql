
-- Ensure payment_methods table has all required columns
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id 
ON public.payment_methods(stripe_payment_method_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_customer_id 
ON public.payment_methods(stripe_customer_id);

-- Drop existing RLS policies and recreate them properly
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Service role can manage all payment methods" ON public.payment_methods;
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

-- Create a stripe_test_cards table for development/testing
CREATE TABLE IF NOT EXISTS public.stripe_test_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  stripe_setup_intent_id TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  label TEXT,
  is_test BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on stripe_test_cards
ALTER TABLE public.stripe_test_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stripe_test_cards
CREATE POLICY "Users can view their own test cards" 
ON public.stripe_test_cards
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own test cards" 
ON public.stripe_test_cards
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all test cards" 
ON public.stripe_test_cards
FOR ALL 
TO service_role 
USING (true);

-- Create indexes for stripe_test_cards
CREATE INDEX IF NOT EXISTS idx_stripe_test_cards_user_id 
ON public.stripe_test_cards(user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_test_cards_stripe_customer_id 
ON public.stripe_test_cards(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_stripe_test_cards_stripe_payment_method_id 
ON public.stripe_test_cards(stripe_payment_method_id);
