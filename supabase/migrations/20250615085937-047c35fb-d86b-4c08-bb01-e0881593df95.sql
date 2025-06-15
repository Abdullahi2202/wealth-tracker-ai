
-- 1. Create a `registration` table for all users (normal and admin)
CREATE TABLE public.registration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- NOTE: For best security, never store plaintext passwords! Use Supabase Auth or hash them!
  full_name TEXT NOT NULL,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.registration ENABLE ROW LEVEL SECURITY;

-- 3. Allow the authenticated user (by matching email) to read/update their own record
CREATE POLICY "Users can view their own registration" 
  ON public.registration
  FOR SELECT 
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update their own registration"
  ON public.registration
  FOR UPDATE 
  USING (auth.jwt() ->> 'email' = email);

-- 4. Allow admins to select everything (assuming is_admin is properly set)
CREATE POLICY "Admins can manage all registrations"
  ON public.registration 
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.registration r2 WHERE r2.email = auth.jwt() ->> 'email' AND r2.is_admin = TRUE
  ));

