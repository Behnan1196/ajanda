-- Create the storage bucket for task attachments
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false);

-- Set up RLS policies for the bucket
create policy "Users can upload their own attachments"
  on storage.objects for insert
  with check ( bucket_id = 'task-attachments' and auth.uid() = owner );

create policy "Users can view their own attachments"
  on storage.objects for select
  using ( bucket_id = 'task-attachments' and auth.uid() = owner );

create policy "Users can update their own attachments"
  on storage.objects for update
  with check ( bucket_id = 'task-attachments' and auth.uid() = owner );

create policy "Users can delete their own attachments"
  on storage.objects for delete
  using ( bucket_id = 'task-attachments' and auth.uid() = owner );
