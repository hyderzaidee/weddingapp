-- Inspiration images for outfits & events
-- Run this in the Supabase SQL editor

alter table public.outfits
  add column if not exists image_urls text[] not null default '{}';

alter table public.events
  add column if not exists image_urls text[] not null default '{}';

-- Public storage bucket for inspo pics
insert into storage.buckets (id, name, public)
values ('inspiration', 'inspiration', true)
on conflict (id) do update set public = true;

-- Permissive policies (app is passcode-gated)
drop policy if exists "Allow all inspiration uploads" on storage.objects;
create policy "Allow all inspiration uploads"
  on storage.objects
  for all
  using (bucket_id = 'inspiration')
  with check (bucket_id = 'inspiration');
