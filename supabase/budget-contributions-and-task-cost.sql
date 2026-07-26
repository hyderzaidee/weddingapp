-- Additive migration for shared local + live Supabase DB.
-- Safe to run once: does not drop notes or budget_categories.
-- Run in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- tasks: cost + category (notes column kept unused for safety)
-- ---------------------------------------------------------------------------
alter table public.tasks
  add column if not exists cost numeric;

alter table public.tasks
  add column if not exists category text;

update public.tasks
set category = 'wedding_preparation'
where category is null;

alter table public.tasks
  alter column category set default 'wedding_preparation';

alter table public.tasks
  alter column category set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_category_check'
  ) then
    alter table public.tasks
      add constraint tasks_category_check
      check (
        category in (
          'wedding_preparation',
          'hiras_stuff',
          'ahmed_and_family'
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- budget_contributions: cash put into the wedding pot by people
-- ---------------------------------------------------------------------------
create table if not exists public.budget_contributions (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists budget_contributions_set_updated_at on public.budget_contributions;
create trigger budget_contributions_set_updated_at
before update on public.budget_contributions
for each row
execute function public.set_updated_at();

alter table public.budget_contributions enable row level security;

drop policy if exists "Allow all on budget_contributions" on public.budget_contributions;
create policy "Allow all on budget_contributions"
  on public.budget_contributions
  for all
  using (true)
  with check (true);
