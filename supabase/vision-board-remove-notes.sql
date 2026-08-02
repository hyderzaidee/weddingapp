-- Optional cleanup: remove legacy sticky notes from vision boards.
-- Safe to run after deploying the photo-comments UI (notes are no longer shown).
-- Run manually in the Supabase SQL editor if you want to purge old note rows.

DELETE FROM vision_board_items
WHERE item_type = 'note';
