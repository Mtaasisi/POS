-- Remove Shelves Management System
-- Migration: 20241201000060_remove_shelves_management.sql

-- Drop triggers first
DROP TRIGGER IF EXISTS update_lats_store_shelves_updated_at ON lats_store_shelves;
DROP TRIGGER IF EXISTS update_shelves_updated_at ON shelves;

-- Drop functions
DROP FUNCTION IF EXISTS update_lats_store_shelves_updated_at();
DROP FUNCTION IF EXISTS update_shelves_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_lats_store_shelves_location;
DROP INDEX IF EXISTS idx_lats_store_shelves_code;
DROP INDEX IF EXISTS idx_lats_store_shelves_type;
DROP INDEX IF EXISTS idx_lats_store_shelves_section;
DROP INDEX IF EXISTS idx_lats_store_shelves_zone;
DROP INDEX IF EXISTS idx_lats_store_shelves_active;
DROP INDEX IF EXISTS idx_lats_store_shelves_priority;

DROP INDEX IF EXISTS idx_shelves_location;
DROP INDEX IF EXISTS idx_shelves_category;
DROP INDEX IF EXISTS idx_shelves_status;
DROP INDEX IF EXISTS idx_shelves_created_at;

-- Drop tables
DROP TABLE IF EXISTS lats_store_shelves;
DROP TABLE IF EXISTS shelves;

-- Remove store_shelf field from lats_products table
ALTER TABLE lats_products DROP COLUMN IF EXISTS store_shelf;

-- Drop the index for store_shelf
DROP INDEX IF EXISTS idx_lats_products_store_shelf;
