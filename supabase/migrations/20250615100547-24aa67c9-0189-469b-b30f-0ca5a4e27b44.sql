
-- Add document fields to registration table for post-registration verification
ALTER TABLE public.registration
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'passport',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- Create a public storage bucket for identity documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', true)
ON CONFLICT (id) DO NOTHING;
