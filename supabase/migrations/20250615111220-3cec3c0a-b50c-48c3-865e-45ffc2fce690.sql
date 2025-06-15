
-- Create table for user identity verification requests
CREATE TABLE IF NOT EXISTS public.identity_verification_requests (
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

-- Enable RLS
ALTER TABLE public.identity_verification_requests ENABLE ROW LEVEL SECURITY;

-- Policy: allow anyone to insert
DROP POLICY IF EXISTS "Anyone can submit verification request" ON public.identity_verification_requests;
CREATE POLICY "Anyone can submit verification request"
  ON public.identity_verification_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: allow the user who created the request to select/view it
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.identity_verification_requests;
CREATE POLICY "Users can view their own verification requests"
  ON public.identity_verification_requests
  FOR SELECT
  TO public
  USING (user_email = auth.jwt() ->> 'email' OR user_email = current_setting('request.jwt.claims', true)::json->>'email');
