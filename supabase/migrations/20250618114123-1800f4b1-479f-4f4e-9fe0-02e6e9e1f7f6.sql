
-- Drop existing problematic tables and policies to start fresh
DROP TABLE IF EXISTS public.identity_verification_requests CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.registration CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Create profiles table that works with Supabase Auth
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user roles table for admin management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create registration table for user data
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

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
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

-- Insert default categories
INSERT INTO public.categories (name, description, color, icon) VALUES
('Food', 'Food and dining expenses', '#f97316', 'Utensils'),
('Housing', 'Rent, utilities, and home expenses', '#06b6d4', 'Home'),
('Transport', 'Transportation and vehicle costs', '#8b5cf6', 'Car'),
('Entertainment', 'Movies, games, and leisure', '#f59e0b', 'Play'),
('Shopping', 'Clothing and personal items', '#ec4899', 'ShoppingBag'),
('Misc', 'Other miscellaneous expenses', '#6b7280', 'Package');

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
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Create wallet for new user
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
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
ALTER TABLE public.identity_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

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

-- Registration policies (public signup)
CREATE POLICY "Anyone can register" ON public.registration
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view their own registration" ON public.registration
  FOR SELECT TO public USING (true);
CREATE POLICY "Service role bypass registration" ON public.registration
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can manage registrations" ON public.registration
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

-- Wallets policies
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role bypass wallets" ON public.wallets
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (public.is_admin());

-- Transactions policies
CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role bypass transactions" ON public.transactions
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.is_admin());

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT TO public USING (true);
CREATE POLICY "Service role bypass categories" ON public.categories
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Create storage bucket for identity documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-docs', 'identity-docs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
CREATE POLICY "Anyone can upload identity docs" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'identity-docs');
CREATE POLICY "Anyone can view identity docs" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'identity-docs');
