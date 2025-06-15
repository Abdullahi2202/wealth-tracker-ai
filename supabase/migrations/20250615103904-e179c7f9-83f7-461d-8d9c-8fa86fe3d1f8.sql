
-- Create a public storage bucket for identity documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Remove old insert policy if it exists
DROP POLICY IF EXISTS "Anyone can upload docs" ON storage.objects;

-- Allow anyone (including unauthenticated) to insert into identity-documents bucket
CREATE POLICY "Anyone can upload docs"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'identity-documents');
