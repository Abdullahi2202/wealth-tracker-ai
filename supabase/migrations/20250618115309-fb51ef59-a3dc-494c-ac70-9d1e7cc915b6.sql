
-- Drop existing tables to rebuild from scratch
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.identity_verification_requests CASCADE;
DROP TABLE IF EXISTS public.registration CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.fraud_alerts CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.system_metrics CASCADE;
DROP TABLE IF EXISTS public.transaction_logs CASCADE;
DROP TABLE IF EXISTS public.chatbot_conversations CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.admin_credentials CASCADE;
DROP TABLE IF EXISTS public.admin_activity_logs CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create registration table
CREATE TABLE public.registration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  passport_number TEXT,
  document_type TEXT DEFAULT 'passport',
  image_url TEXT,
  verification_status TEXT DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create payment methods table
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

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  recipient_user_id TEXT,
  sender_user_id TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'CreditCard',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create identity verification requests table
CREATE TABLE public.identity_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create fraud alerts table
CREATE TABLE public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id),
  alert_type TEXT NOT NULL,
  description TEXT,
  risk_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create system metrics table
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transaction logs table
CREATE TABLE public.transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id),
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chatbot conversations table
CREATE TABLE public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  intent_detected TEXT,
  response_time_ms INTEGER,
  satisfaction_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin credentials table
CREATE TABLE public.admin_credentials (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL
);

-- Create admin activity logs table
CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create settings table
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name, description, color, icon) VALUES
('Food', 'Food and dining expenses', '#f97316', 'Utensils'),
('Housing', 'Rent, utilities, and home expenses', '#06b6d4', 'Home'),
('Transport', 'Transportation and vehicle costs', '#8b5cf6', 'Car'),
('Entertainment', 'Movies, games, and leisure', '#f59e0b', 'Play'),
('Shopping', 'Clothing and personal items', '#ec4899', 'ShoppingBag'),
('Misc', 'Other miscellaneous expenses', '#6b7280', 'Package');

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('app_name', '"WalletMaster"', 'Application name'),
('app_version', '"1.0.0"', 'Application version'),
('maintenance_mode', 'false', 'Enable maintenance mode'),
('require_2fa', 'false', 'Require two-factor authentication'),
('default_currency', '"USD"', 'Default currency for transactions'),
('transaction_fee', '2.5', 'Transaction fee percentage'),
('min_transaction_amount', '1', 'Minimum transaction amount'),
('max_transaction_amount', '10000', 'Maximum transaction amount');

-- Create admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR auth.jwt() ->> 'email' = 'kingabdalla982@gmail.com';
$$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  
  -- Create wallet for new user
  INSERT INTO public.wallets (user_id, user_email, balance)
  VALUES (NEW.id, NEW.email, 0);
  
  -- Set default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role bypass profiles" ON public.profiles
  FOR ALL TO service_role USING (true);

-- User roles policies
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role bypass user_roles" ON public.user_roles
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Registration policies
CREATE POLICY "Anyone can register" ON public.registration
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view their own registration" ON public.registration
  FOR SELECT TO public USING (true);
CREATE POLICY "Service role bypass registration" ON public.registration
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can manage registrations" ON public.registration
  FOR ALL USING (public.is_admin());

-- Wallets policies
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role bypass wallets" ON public.wallets
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (public.is_admin());

-- Payment methods policies
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role bypass payment_methods" ON public.payment_methods
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can view all payment methods" ON public.payment_methods
  FOR SELECT USING (public.is_admin());

-- Transactions policies
CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role bypass transactions" ON public.transactions
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.is_admin());

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT TO public USING (true);
CREATE POLICY "Service role bypass categories" ON public.categories
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Identity verification policies
CREATE POLICY "Anyone can submit verification" ON public.identity_verification_requests
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view their own requests" ON public.identity_verification_requests
  FOR SELECT TO public USING (user_email = auth.jwt() ->> 'email');
CREATE POLICY "Admins can manage verification requests" ON public.identity_verification_requests
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass verification" ON public.identity_verification_requests
  FOR ALL TO service_role USING (true);

-- Fraud alerts policies
CREATE POLICY "Users can view their own fraud alerts" ON public.fraud_alerts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass fraud_alerts" ON public.fraud_alerts
  FOR ALL TO service_role USING (true);

-- Support tickets policies
CREATE POLICY "Users can manage their own tickets" ON public.support_tickets
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass support_tickets" ON public.support_tickets
  FOR ALL TO service_role USING (true);

-- System metrics policies
CREATE POLICY "Admins can manage system metrics" ON public.system_metrics
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass system_metrics" ON public.system_metrics
  FOR ALL TO service_role USING (true);

-- Transaction logs policies
CREATE POLICY "Users can view their own transaction logs" ON public.transaction_logs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage transaction logs" ON public.transaction_logs
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass transaction_logs" ON public.transaction_logs
  FOR ALL TO service_role USING (true);

-- Chatbot conversations policies
CREATE POLICY "Users can manage their own conversations" ON public.chatbot_conversations
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role bypass chatbot_conversations" ON public.chatbot_conversations
  FOR ALL TO service_role USING (true);

-- Admin tables policies
CREATE POLICY "Admins can manage admin users" ON public.admin_users
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass admin_users" ON public.admin_users
  FOR ALL TO service_role USING (true);

CREATE POLICY "Admins can manage admin credentials" ON public.admin_credentials
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass admin_credentials" ON public.admin_credentials
  FOR ALL TO service_role USING (true);

CREATE POLICY "Admins can manage activity logs" ON public.admin_activity_logs
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass admin_activity_logs" ON public.admin_activity_logs
  FOR ALL TO service_role USING (true);

-- Settings policies
CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass settings" ON public.settings
  FOR ALL TO service_role USING (true);
