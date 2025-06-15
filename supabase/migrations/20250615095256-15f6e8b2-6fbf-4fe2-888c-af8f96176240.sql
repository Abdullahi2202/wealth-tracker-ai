
-- Drop the "Admins can manage all registrations" policy because it depends on is_admin
DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.registration;

-- Now it's safe to remove the is_admin column
ALTER TABLE public.registration 
DROP COLUMN IF EXISTS is_admin;
