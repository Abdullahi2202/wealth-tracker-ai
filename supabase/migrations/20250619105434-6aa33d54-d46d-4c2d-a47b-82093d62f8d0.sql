
-- Create connect accounts table for Stripe Connect
CREATE TABLE public.connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'express',
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  onboarding_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payout_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  arrival_date TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create topup sessions table
CREATE TABLE public.topup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create money transfers table
CREATE TABLE public.money_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_transfer_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment transactions table for webhook tracking
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  payment_method TEXT,
  description TEXT,
  metadata JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for connect_accounts
CREATE POLICY "Users can view own connect account" ON public.connect_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own connect account" ON public.connect_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert connect accounts" ON public.connect_accounts
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for payouts
CREATE POLICY "Users can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage payouts" ON public.payouts
  FOR ALL WITH CHECK (true);

-- Create RLS policies for topup_sessions
CREATE POLICY "Users can view own topup sessions" ON public.topup_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage topup sessions" ON public.topup_sessions
  FOR ALL WITH CHECK (true);

-- Create RLS policies for money_transfers
CREATE POLICY "Users can view transfers they're involved in" ON public.money_transfers
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "System can manage transfers" ON public.money_transfers
  FOR ALL WITH CHECK (true);

-- Create RLS policies for payment_transactions
CREATE POLICY "Users can view own payment transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage payment transactions" ON public.payment_transactions
  FOR ALL WITH CHECK (true);

-- Create admin policies (admins can view all data)
CREATE POLICY "Admins can view all connect accounts" ON public.connect_accounts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all payouts" ON public.payouts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all topup sessions" ON public.topup_sessions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all money transfers" ON public.money_transfers
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all payment transactions" ON public.payment_transactions
  FOR SELECT USING (public.is_admin());
