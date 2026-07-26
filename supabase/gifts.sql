-- Gifts module (matches current Supabase table)
-- Run only if creating fresh; your live table may already differ.

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  "To Whom" text,
  "What to buy" text,
  event_name text,
  status text not null default 'idea'
    check (status in ('idea', 'ordered', 'purchased', 'wrapped', 'given')),
  cost numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gifts enable row level security;

drop policy if exists "Allow all on gifts" on public.gifts;
create policy "Allow all on gifts"
  on public.gifts
  for all
  using (true)
  with check (true);
