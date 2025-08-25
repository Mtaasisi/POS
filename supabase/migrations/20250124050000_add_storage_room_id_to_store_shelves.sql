-- Migration: 20250124050000_add_storage_room_id_to_store_shelves.sql
-- Purpose: Link store shelves to storage rooms and ensure unique row/column per room

-- Add storage_room_id column to lats_store_shelves
ALTER TABLE lats_store_shelves 
ADD COLUMN IF NOT EXISTS storage_room_id UUID REFERENCES lats_storage_rooms(id) ON DELETE SET NULL;

-- Index for fast lookups by storage room
CREATE INDEX IF NOT EXISTS idx_lats_store_shelves_storage_room 
  ON lats_store_shelves(storage_room_id);

-- Ensure a shelf cell (row_number, column_number) is unique within a storage room
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uniq_lats_store_shelves_room_row_col'
  ) THEN
    ALTER TABLE lats_store_shelves
      ADD CONSTRAINT uniq_lats_store_shelves_room_row_col
      UNIQUE (storage_room_id, row_number, column_number);
  END IF;
END $$;


