-- Make storage room name field optional
-- This allows existing storage rooms to keep their names but new ones don't need them

-- First, make the name field nullable
ALTER TABLE lats_storage_rooms ALTER COLUMN name DROP NOT NULL;

-- Update existing records to use code as name if name is empty
UPDATE lats_storage_rooms 
SET name = code 
WHERE name IS NULL OR name = '';

-- Optional: You can also set a default value for the name field
-- ALTER TABLE lats_storage_rooms ALTER COLUMN name SET DEFAULT '';

-- Note: The name field is kept in the database for backward compatibility
-- but the UI will only show and use the code field
