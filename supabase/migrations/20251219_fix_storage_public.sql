-- Make the bucket public
update storage.buckets
set public = true
where id = 'task-attachments';

-- Update the select policy to allow public retrieval of images
-- (Since bucket is public, we still want to make sure the policy allows it if RLS is on)
drop policy if exists "Users can view their own attachments" on storage.objects;

create policy "Anyone can view task attachments"
  on storage.objects for select
  using ( bucket_id = 'task-attachments' );
