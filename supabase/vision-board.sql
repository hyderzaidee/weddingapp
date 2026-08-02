-- Additive migration: shared vision boards (Dholki, Mayon, Barat, Valima).
-- Run in the Supabase SQL editor (shared local + live DB).

create table if not exists public.vision_board_items (
  id uuid primary key default gen_random_uuid(),
  board text not null
    check (board in ('dholki', 'mayon', 'barat', 'valima')),
  item_type text not null
    check (item_type in ('note', 'image', 'link')),
  title text,
  content text,
  image_url text,
  note_color text not null default 'gold'
    check (note_color in ('gold', 'blush', 'mint', 'cream', 'lilac')),
  pos_x numeric not null default 40,
  pos_y numeric not null default 40,
  z_index integer not null default 1,
  scale numeric not null default 1
    check (scale >= 0.75 and scale <= 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vision_board_items_payload_check check (
    (item_type = 'note' and content is not null)
    or (item_type = 'image' and image_url is not null)
    or (item_type = 'link' and content is not null)
  )
);

-- Safe if the table already existed without positions
alter table public.vision_board_items
  add column if not exists pos_x numeric not null default 40;
alter table public.vision_board_items
  add column if not exists pos_y numeric not null default 40;
alter table public.vision_board_items
  add column if not exists z_index integer not null default 1;
alter table public.vision_board_items
  add column if not exists scale numeric not null default 1;

create index if not exists vision_board_items_board_idx
  on public.vision_board_items (board, created_at);

drop trigger if exists vision_board_items_set_updated_at on public.vision_board_items;
create trigger vision_board_items_set_updated_at
before update on public.vision_board_items
for each row
execute function public.set_updated_at();

alter table public.vision_board_items enable row level security;

drop policy if exists "Allow all on vision_board_items" on public.vision_board_items;
create policy "Allow all on vision_board_items"
  on public.vision_board_items
  for all
  using (true)
  with check (true);
