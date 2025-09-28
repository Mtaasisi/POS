-- Make Storage Room Name Optional Migration
-- Migration: 20241201000064_make_storage_room_name_optional.sql

-- Make the name field optional in storage rooms table
ALTER TABLE lats_storage_rooms ALTER COLUMN name DROP NOT NULL;

-- Update existing records to use code as name if name is empty
UPDATE lats_storage_rooms 
SET name = code 
WHERE name IS NULL OR name = '';

-- Add a comment to document the change
COMMENT ON COLUMN lats_storage_rooms.name IS 'Optional name for the storage room. If not provided, the code will be used as the display name.';
