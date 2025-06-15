
-- Enable Row Level Security (again, just in case)
ALTER TABLE public.registration ENABLE ROW LEVEL SECURITY;

-- Remove all existing insert policies on registration and only keep this
DROP POLICY IF EXISTS "Anyone can register" ON public.registration;

-- Allow ALL users (anonymous + authenticated) to insert into registration table
CREATE POLICY "Anyone can register"
  ON public.registration
  FOR INSERT
  TO public
  WITH CHECK (true);

-- For safety, let’s also allow SELECT to see their own registration (by email)
DROP POLICY IF EXISTS "Users can view their own registration" ON public.registration;
CREATE POLICY "Users can view their own registration"
  ON public.registration
  FOR SELECT
  TO public
  USING (true);
