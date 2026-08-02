-- Additive: per-photo pinch scale for vision board images.
-- Run in Supabase SQL editor if the table already exists.

alter table public.vision_board_items
  add column if not exists scale numeric not null default 1;

-- Optional clamp via check only if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vision_board_items_scale_check'
  ) then
    alter table public.vision_board_items
      add constraint vision_board_items_scale_check
      check (scale >= 0.75 and scale <= 3);
  end if;
end $$;
