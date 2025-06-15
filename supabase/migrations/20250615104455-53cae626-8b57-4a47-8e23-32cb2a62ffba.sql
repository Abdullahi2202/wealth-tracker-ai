
-- Create the public identity-documents storage bucket if not created
insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', true)
on conflict (id) do nothing;

-- Remove any old policies, re-create the correct policy for open insert
drop policy if exists "Anyone can upload docs" on storage.objects;

create policy "Anyone can upload docs"
  on storage.objects
  for insert
  to public
  with check (bucket_id = 'identity-documents');
