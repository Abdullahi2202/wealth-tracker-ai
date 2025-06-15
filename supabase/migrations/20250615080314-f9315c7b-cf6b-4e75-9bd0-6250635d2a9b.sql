
-- Create a simple function that checks admin status without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles for themselves" ON public.user_roles;

-- Create new policies that don't reference other tables
CREATE POLICY "Enable read access for own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Enable insert for own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for own role" 
ON public.user_roles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Enable delete for own role" 
ON public.user_roles 
FOR DELETE 
USING (user_id = auth.uid());

-- Service role bypass policy
CREATE POLICY "Service role bypass" 
ON public.user_roles 
FOR ALL 
TO service_role
USING (true);

-- Update users table policies to be simpler
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Simple users table policies
CREATE POLICY "Enable read access for own profile" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Enable insert for own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "Enable update for own profile" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid());

-- Service role bypass for users
CREATE POLICY "Service role bypass users" 
ON public.users 
FOR ALL 
TO service_role
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
