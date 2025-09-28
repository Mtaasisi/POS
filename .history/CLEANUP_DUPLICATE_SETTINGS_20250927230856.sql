-- =====================================================
-- CLEANUP DUPLICATE POS SETTINGS RECORDS
-- =====================================================
-- This script removes duplicate settings records that are causing
-- warnings in the POS system console logs.
-- 
-- The issue: Multiple records exist for the same user_id in various
-- settings tables, causing the warning:
-- "⚠️ Multiple [settings_type] settings found (X records), using the first one"
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- 1. CLEANUP DYNAMIC PRICING SETTINGS DUPLICATES
-- =====================================================
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicates in pricing settings
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_dynamic_pricing_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate pricing settings records to clean up', duplicate_count;
        
        -- Delete duplicates, keeping the most recent one (highest id)
        DELETE FROM lats_pos_dynamic_pricing_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_dynamic_pricing_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up pricing settings duplicates';
    ELSE
        RAISE NOTICE 'No pricing settings duplicates found';
    END IF;
END $$;

-- =====================================================
-- 2. CLEANUP RECEIPT SETTINGS DUPLICATES
-- =====================================================
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicates in receipt settings
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_receipt_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate receipt settings records to clean up', duplicate_count;
        
        -- Delete duplicates, keeping the most recent one
        DELETE FROM lats_pos_receipt_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_receipt_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up receipt settings duplicates';
    ELSE
        RAISE NOTICE 'No receipt settings duplicates found';
    END IF;
END $$;

-- =====================================================
-- 3. CLEANUP DELIVERY SETTINGS DUPLICATES
-- =====================================================
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicates in delivery settings
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_delivery_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate delivery settings records to clean up', duplicate_count;
        
        -- Delete duplicates, keeping the most recent one
        DELETE FROM lats_pos_delivery_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_delivery_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up delivery settings duplicates';
    ELSE
        RAISE NOTICE 'No delivery settings duplicates found';
    END IF;
END $$;

-- =====================================================
-- 4. CLEANUP ADVANCED SETTINGS DUPLICATES
-- =====================================================
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicates in advanced settings
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_advanced_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate advanced settings records to clean up', duplicate_count;
        
        -- Delete duplicates, keeping the most recent one
        DELETE FROM lats_pos_advanced_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_advanced_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up advanced settings duplicates';
    ELSE
        RAISE NOTICE 'No advanced settings duplicates found';
    END IF;
END $$;

-- =====================================================
-- 5. CLEANUP OTHER SETTINGS TABLES (PREVENTIVE)
-- =====================================================

-- General Settings
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_general_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate general settings records to clean up', duplicate_count;
        
        DELETE FROM lats_pos_general_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_general_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up general settings duplicates';
    ELSE
        RAISE NOTICE 'No general settings duplicates found';
    END IF;
END $$;

-- Scanner Settings
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_barcode_scanner_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate scanner settings records to clean up', duplicate_count;
        
        DELETE FROM lats_pos_barcode_scanner_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_barcode_scanner_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up scanner settings duplicates';
    ELSE
        RAISE NOTICE 'No scanner settings duplicates found';
    END IF;
END $$;

-- Search Filter Settings
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_search_filter_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate search filter settings records to clean up', duplicate_count;
        
        DELETE FROM lats_pos_search_filter_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_search_filter_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up search filter settings duplicates';
    ELSE
        RAISE NOTICE 'No search filter settings duplicates found';
    END IF;
END $$;

-- User Permissions Settings
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_user_permissions_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate user permissions settings records to clean up', duplicate_count;
        
        DELETE FROM lats_pos_user_permissions_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_user_permissions_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up user permissions settings duplicates';
    ELSE
        RAISE NOTICE 'No user permissions settings duplicates found';
    END IF;
END $$;

-- Loyalty Customer Settings
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_loyalty_customer_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate loyalty customer settings records to clean up', duplicate_count;
        
        DELETE FROM lats_pos_loyalty_customer_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_loyalty_customer_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up loyalty customer settings duplicates';
    ELSE
        RAISE NOTICE 'No loyalty customer settings duplicates found';
    END IF;
END $$;

-- Analytics Reporting Settings
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_analytics_reporting_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate analytics reporting settings records to clean up', duplicate_count;
        
        DELETE FROM lats_pos_analytics_reporting_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_analytics_reporting_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up analytics reporting settings duplicates';
    ELSE
        RAISE NOTICE 'No analytics reporting settings duplicates found';
    END IF;
END $$;

-- Notification Settings
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, business_id, COUNT(*) as cnt
        FROM lats_pos_notification_settings
        GROUP BY user_id, business_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate notification settings records to clean up', duplicate_count;
        
        DELETE FROM lats_pos_notification_settings
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id, business_id) id
            FROM lats_pos_notification_settings
            ORDER BY user_id, business_id, created_at DESC, id DESC
        );
        
        RAISE NOTICE 'Cleaned up notification settings duplicates';
    ELSE
        RAISE NOTICE 'No notification settings duplicates found';
    END IF;
END $$;

-- =====================================================
-- 6. VERIFY CLEANUP RESULTS
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=== CLEANUP VERIFICATION ===';
    RAISE NOTICE 'Pricing settings count: %', (SELECT COUNT(*) FROM lats_pos_dynamic_pricing_settings);
    RAISE NOTICE 'Receipt settings count: %', (SELECT COUNT(*) FROM lats_pos_receipt_settings);
    RAISE NOTICE 'Delivery settings count: %', (SELECT COUNT(*) FROM lats_pos_delivery_settings);
    RAISE NOTICE 'Advanced settings count: %', (SELECT COUNT(*) FROM lats_pos_advanced_settings);
    RAISE NOTICE 'General settings count: %', (SELECT COUNT(*) FROM lats_pos_general_settings);
    RAISE NOTICE 'Scanner settings count: %', (SELECT COUNT(*) FROM lats_pos_barcode_scanner_settings);
    RAISE NOTICE 'Search filter settings count: %', (SELECT COUNT(*) FROM lats_pos_search_filter_settings);
    RAISE NOTICE 'User permissions settings count: %', (SELECT COUNT(*) FROM lats_pos_user_permissions_settings);
    RAISE NOTICE 'Loyalty customer settings count: %', (SELECT COUNT(*) FROM lats_pos_loyalty_customer_settings);
    RAISE NOTICE 'Analytics reporting settings count: %', (SELECT COUNT(*) FROM lats_pos_analytics_reporting_settings);
    RAISE NOTICE 'Notification settings count: %', (SELECT COUNT(*) FROM lats_pos_notification_settings);
    RAISE NOTICE '=== CLEANUP COMPLETED ===';
END $$;

-- =====================================================
-- 7. ENSURE UNIQUE CONSTRAINTS ARE WORKING
-- =====================================================
-- Add unique constraints if they don't exist
ALTER TABLE lats_pos_dynamic_pricing_settings 
ADD CONSTRAINT IF NOT EXISTS unique_pricing_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_receipt_settings 
ADD CONSTRAINT IF NOT EXISTS unique_receipt_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_delivery_settings 
ADD CONSTRAINT IF NOT EXISTS unique_delivery_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_advanced_settings 
ADD CONSTRAINT IF NOT EXISTS unique_advanced_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_general_settings 
ADD CONSTRAINT IF NOT EXISTS unique_general_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_barcode_scanner_settings 
ADD CONSTRAINT IF NOT EXISTS unique_scanner_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_search_filter_settings 
ADD CONSTRAINT IF NOT EXISTS unique_search_filter_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_user_permissions_settings 
ADD CONSTRAINT IF NOT EXISTS unique_user_permissions_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_loyalty_customer_settings 
ADD CONSTRAINT IF NOT EXISTS unique_loyalty_customer_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_analytics_reporting_settings 
ADD CONSTRAINT IF NOT EXISTS unique_analytics_reporting_user_business 
UNIQUE (user_id, business_id);

ALTER TABLE lats_pos_notification_settings 
ADD CONSTRAINT IF NOT EXISTS unique_notification_user_business 
UNIQUE (user_id, business_id);

-- Commit the transaction
COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Duplicate settings cleanup completed successfully!' as status;
