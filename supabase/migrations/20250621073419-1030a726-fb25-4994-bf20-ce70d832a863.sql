
-- First, let's ensure the registration table has the correct structure
ALTER TABLE public.registration 
ALTER COLUMN verification_status SET DEFAULT 'pending';

-- Update any existing null verification_status values
UPDATE public.registration 
SET verification_status = 'pending' 
WHERE verification_status IS NULL;

-- Ensure identity_verification_requests table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.identity_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  document_type text NOT NULL,
  document_number text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by text
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_identity_verification_user_email 
ON public.identity_verification_requests(user_email);

CREATE INDEX IF NOT EXISTS idx_registration_verification_status 
ON public.registration(verification_status);
