-- Add search_debounce_time field to lats_pos_search_filter_settings table
-- This field is used by the frontend but was missing from the database table

ALTER TABLE lats_pos_search_filter_settings 
ADD COLUMN IF NOT EXISTS search_debounce_time INTEGER DEFAULT 300 CHECK (search_debounce_time BETWEEN 100 AND 1000);

-- Add comment to document the field
COMMENT ON COLUMN lats_pos_search_filter_settings.search_debounce_time IS 'Debounce time in milliseconds for search input to prevent excessive API calls';

-- Update existing records to have the default value
UPDATE lats_pos_search_filter_settings 
SET search_debounce_time = 300 
WHERE search_debounce_time IS NULL;
