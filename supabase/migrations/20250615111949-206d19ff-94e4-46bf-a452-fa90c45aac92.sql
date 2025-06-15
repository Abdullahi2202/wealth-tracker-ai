
-- Delete any buckets with similar names so we only use the correct new one
DELETE FROM storage.buckets WHERE id IN ('identity-documents', 'identity-docs');

-- Create the 'identity-documents' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true, name = 'identity-documents';

-- Remove all old insert policies on storage.objects (cleanup)
DROP POLICY IF EXISTS "Anyone can upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents after verification" ON storage.objects;

-- Allow anyone (including public, unauthenticated) to INSERT files into 'identity-documents'
CREATE POLICY "Anyone can upload docs"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'identity-documents');
