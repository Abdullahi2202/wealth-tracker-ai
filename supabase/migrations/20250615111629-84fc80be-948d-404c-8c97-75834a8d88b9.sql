
-- 1. Create the public storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remove any old insert policy, then allow anyone to insert into this bucket
DROP POLICY IF EXISTS "Anyone can upload docs" ON storage.objects;

CREATE POLICY "Anyone can upload docs"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'identity-documents');
