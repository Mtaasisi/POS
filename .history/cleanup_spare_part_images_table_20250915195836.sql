-- Cleanup script for spare_part_images table
-- Run this if you want to start completely fresh

-- Drop policies first
DROP POLICY IF EXISTS "Allow authenticated users to view spare part images" ON spare_part_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert spare part images" ON spare_part_images;
DROP POLICY IF EXISTS "Allow authenticated users to update spare part images" ON spare_part_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete spare part images" ON spare_part_images;

-- Drop triggers
DROP TRIGGER IF EXISTS update_spare_part_images_updated_at ON spare_part_images;
DROP TRIGGER IF EXISTS ensure_single_primary_spare_part_image_trigger ON spare_part_images;

-- Drop the table completely
DROP TABLE IF EXISTS spare_part_images CASCADE;

-- Drop the function (only if no other tables use it)
-- DROP FUNCTION IF EXISTS ensure_single_primary_spare_part_image();

SELECT 'spare_part_images table cleaned up successfully' as status;
