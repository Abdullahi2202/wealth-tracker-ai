
-- Add missing columns to registrations table for document type and verification status
ALTER TABLE public.registrations 
ADD COLUMN document_type TEXT DEFAULT 'passport',
ADD COLUMN verification_status TEXT DEFAULT 'pending';

-- Create storage bucket for identity documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('identity-docs', 'identity-docs', false);

-- Create storage policies for identity documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'identity-docs' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'identity-docs' AND
  public.is_admin()
);

CREATE POLICY "Users can view their own documents after verification" ON storage.objects
FOR SELECT USING (
  bucket_id = 'identity-docs' AND
  auth.role() = 'authenticated'
);
