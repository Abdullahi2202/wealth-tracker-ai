
-- Enable public sign-up: Allow anon (unauthenticated) and authenticated users to INSERT into the registration table

-- Enable RLS if not already enabled
ALTER TABLE public.registration ENABLE ROW LEVEL SECURITY;

-- Drop old policy if it exists (to prevent duplicates)
DROP POLICY IF EXISTS "Anyone can register" ON public.registration;

-- Corrected: Use WITH CHECK for INSERT (not USING)
CREATE POLICY "Anyone can register"
  ON public.registration
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- (No changes to SELECT/UPDATE/DELETE policies)
