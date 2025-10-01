-- =====================================================
-- CLEANUP AND RECREATE QUALITY CHECK SYSTEM
-- =====================================================
-- Run this first to clean up any partial installations

-- Drop existing tables (CASCADE will drop dependencies)
DROP TABLE IF EXISTS quality_check_items CASCADE;
DROP TABLE IF EXISTS purchase_order_quality_check_items CASCADE;
DROP TABLE IF EXISTS purchase_order_quality_checks CASCADE;
DROP TABLE IF EXISTS quality_check_criteria CASCADE;
DROP TABLE IF EXISTS quality_check_templates CASCADE;

-- Drop the old basic quality checks table if it exists
DROP TABLE IF EXISTS purchase_order_quality_checks_old CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_quality_check_from_template;

-- All cleaned up! Now run the main migration file:
-- 20251001_create_quality_check_system.sql

