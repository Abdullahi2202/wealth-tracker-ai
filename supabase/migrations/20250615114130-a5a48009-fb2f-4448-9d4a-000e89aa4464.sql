
-- Create the identity-documents bucket (if it does not exist)
insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', true)
on conflict (id) do update set public = true, name = 'identity-documents';

-- Remove any old insert policy for this bucket on storage.objects
drop policy if exists "Anyone can upload docs" on storage.objects;

-- Create public insert policy for identity-documents bucket
create policy "Anyone can upload docs"
  on storage.objects
  for insert
  to public
  with check (bucket_id = 'identity-documents');
