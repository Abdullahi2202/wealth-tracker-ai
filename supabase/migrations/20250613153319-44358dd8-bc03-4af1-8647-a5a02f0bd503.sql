
-- Create users table for real user management
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  passport_number TEXT,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real payment processing table
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create real wallet system
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0, -- in cents
  currency TEXT DEFAULT 'usd',
  is_frozen BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real transaction logs
CREATE TABLE public.transaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'credit', 'debit', 'transfer'
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stored payment methods (real Stripe integration)
CREATE TABLE public.stored_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stored_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage admin users" ON public.admin_users FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all payments" ON public.payment_transactions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all wallets" ON public.user_wallets FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all transaction logs" ON public.transaction_logs FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all payment methods" ON public.stored_payment_methods FOR ALL USING (public.is_admin());

-- Create service policies for backend functions
CREATE POLICY "Service can manage users" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service can manage payments" ON public.payment_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service can manage wallets" ON public.user_wallets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service can manage transaction logs" ON public.transaction_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service can manage payment methods" ON public.stored_payment_methods FOR ALL USING (auth.role() = 'service_role');
