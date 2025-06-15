
-- Update the existing is_admin function to prevent recursion instead of dropping it
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR auth.jwt() ->> 'email' = 'kingabdalla982@gmail.com';
$$;

-- Drop the existing problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;

-- Create simple RLS policies for user_roles table
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert roles for themselves" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Make sure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Also fix the users table policies to prevent recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

-- Create simple policies for users table
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Service role can manage all users" 
ON public.users 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid());

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Fix wallets table policies too
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Service role can manage wallets" ON public.wallets;

CREATE POLICY "Users can view their own wallet" 
ON public.wallets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all wallets" 
ON public.wallets 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert their own wallet" 
ON public.wallets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Enable RLS on wallets table
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
