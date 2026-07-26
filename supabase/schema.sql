-- Hira Wedding Expenses — initial schema
-- Run this in the Supabase SQL editor

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at in sync
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to text,
  event_name text,
  due_date date,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  notes text,
  cost numeric,
  category text not null default 'wedding_preparation'
    check (
      category in (
        'wedding_preparation',
        'hiras_stuff',
        'ahmed_and_family'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- budget_categories
-- ---------------------------------------------------------------------------
create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  category_name text not null,
  estimated_amount numeric not null default 0,
  actual_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger budget_categories_set_updated_at
before update on public.budget_categories
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- budget_contributions
-- ---------------------------------------------------------------------------
create table public.budget_contributions (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger budget_contributions_set_updated_at
before update on public.budget_contributions
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- money_transactions
-- ---------------------------------------------------------------------------
create table public.money_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  description text not null,
  amount numeric not null,
  paid_by text,
  category text,
  payment_method text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- outfits
-- ---------------------------------------------------------------------------
create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  event_name text,
  outfit_description text,
  status text not null default 'idea'
    check (status in ('idea', 'ordered', 'fitting', 'ready')),
  vendor text,
  cost numeric,
  notes text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger outfits_set_updated_at
before update on public.outfits
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_date date,
  venue text,
  guest_count integer,
  notes text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- gifts
-- ---------------------------------------------------------------------------
create table public.gifts (
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

create trigger gifts_set_updated_at
before update on public.gifts
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (permissive — app passcode gates access)
-- ---------------------------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.budget_categories enable row level security;
alter table public.budget_contributions enable row level security;
alter table public.money_transactions enable row level security;
alter table public.outfits enable row level security;
alter table public.events enable row level security;
alter table public.gifts enable row level security;

create policy "Allow all on tasks"
  on public.tasks
  for all
  using (true)
  with check (true);

create policy "Allow all on budget_categories"
  on public.budget_categories
  for all
  using (true)
  with check (true);

create policy "Allow all on budget_contributions"
  on public.budget_contributions
  for all
  using (true)
  with check (true);

create policy "Allow all on money_transactions"
  on public.money_transactions
  for all
  using (true)
  with check (true);

create policy "Allow all on outfits"
  on public.outfits
  for all
  using (true)
  with check (true);

create policy "Allow all on events"
  on public.events
  for all
  using (true)
  with check (true);

create policy "Allow all on gifts"
  on public.gifts
  for all
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Inspiration image storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('inspiration', 'inspiration', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow all inspiration uploads" on storage.objects;
create policy "Allow all inspiration uploads"
  on storage.objects
  for all
  using (bucket_id = 'inspiration')
  with check (bucket_id = 'inspiration');
