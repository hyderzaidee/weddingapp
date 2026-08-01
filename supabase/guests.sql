-- Additive migration: guest list per event.
-- Run in the Supabase SQL editor (shared local + live DB).

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  member_count integer not null default 1
    check (member_count >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guests_event_id_idx on public.guests (event_id);

drop trigger if exists guests_set_updated_at on public.guests;
create trigger guests_set_updated_at
before update on public.guests
for each row
execute function public.set_updated_at();

alter table public.guests enable row level security;

drop policy if exists "Allow all on guests" on public.guests;
create policy "Allow all on guests"
  on public.guests
  for all
  using (true)
  with check (true);
