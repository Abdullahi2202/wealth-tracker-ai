
-- Add missing columns to identity_verification_requests table
ALTER TABLE public.identity_verification_requests 
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on identity_verification_requests if not already enabled
ALTER TABLE public.identity_verification_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Admins can manage verification requests" ON public.identity_verification_requests;
DROP POLICY IF EXISTS "Service can manage verification requests" ON public.identity_verification_requests;

-- Create RLS policies for the table
CREATE POLICY "Admins can manage verification requests" 
ON public.identity_verification_requests 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Service can manage verification requests" 
ON public.identity_verification_requests 
FOR ALL 
USING (auth.role() = 'service_role');
