-- Migration: 20241201000005_rollback_subbrands.sql
-- Rollback subbrands support from lats_brands table

-- Drop triggers first
DROP TRIGGER IF EXISTS check_brand_circular_reference_trigger ON lats_brands;
DROP TRIGGER IF EXISTS update_lats_brands_updated_at ON lats_brands;

-- Drop functions
DROP FUNCTION IF EXISTS check_brand_circular_reference();
DROP FUNCTION IF EXISTS get_brand_hierarchy();
DROP FUNCTION IF EXISTS get_root_brands();
DROP FUNCTION IF EXISTS get_subbrands(UUID);

-- Drop indexes
DROP INDEX IF EXISTS lats_brands_name_parent_unique;
DROP INDEX IF EXISTS idx_lats_brands_parent_id;

-- Remove columns (in reverse order of addition)
ALTER TABLE lats_brands DROP COLUMN IF EXISTS metadata;
ALTER TABLE lats_brands DROP COLUMN IF EXISTS icon;
ALTER TABLE lats_brands DROP COLUMN IF EXISTS color;
ALTER TABLE lats_brands DROP COLUMN IF EXISTS sort_order;
ALTER TABLE lats_brands DROP COLUMN IF EXISTS is_active;
ALTER TABLE lats_brands DROP COLUMN IF EXISTS parent_id;

-- Restore the original unique constraint on name
ALTER TABLE lats_brands ADD CONSTRAINT lats_brands_name_key UNIQUE (name);
