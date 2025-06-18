
-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'card',
  brand TEXT,
  last4 TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  label TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_methods table
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role bypass payment_methods" ON public.payment_methods
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can view all payment methods" ON public.payment_methods
  FOR SELECT USING (public.is_admin());
