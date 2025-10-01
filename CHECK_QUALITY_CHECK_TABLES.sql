-- =====================================================
-- CHECK EXISTING QUALITY CHECK TABLES AND FUNCTIONS
-- This script checks what quality check components exist
-- =====================================================

-- =====================================================
-- STEP 1: CHECK TABLES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 Checking existing quality check tables...';
    
    -- Check quality_check_templates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quality_check_templates') THEN
        RAISE NOTICE '✅ quality_check_templates table exists';
        
        -- Check row count
        RAISE NOTICE '   - Rows in quality_check_templates: %', (SELECT COUNT(*) FROM quality_check_templates);
    ELSE
        RAISE NOTICE '❌ quality_check_templates table does NOT exist';
    END IF;
    
    -- Check quality_check_criteria
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quality_check_criteria') THEN
        RAISE NOTICE '✅ quality_check_criteria table exists';
        RAISE NOTICE '   - Rows in quality_check_criteria: %', (SELECT COUNT(*) FROM quality_check_criteria);
    ELSE
        RAISE NOTICE '❌ quality_check_criteria table does NOT exist';
    END IF;
    
    -- Check purchase_order_quality_checks
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_quality_checks') THEN
        RAISE NOTICE '✅ purchase_order_quality_checks table exists';
        RAISE NOTICE '   - Rows in purchase_order_quality_checks: %', (SELECT COUNT(*) FROM purchase_order_quality_checks);
    ELSE
        RAISE NOTICE '❌ purchase_order_quality_checks table does NOT exist';
    END IF;
    
    -- Check purchase_order_quality_check_items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_quality_check_items') THEN
        RAISE NOTICE '✅ purchase_order_quality_check_items table exists';
        RAISE NOTICE '   - Rows in purchase_order_quality_check_items: %', (SELECT COUNT(*) FROM purchase_order_quality_check_items);
    ELSE
        RAISE NOTICE '❌ purchase_order_quality_check_items table does NOT exist';
    END IF;
END $$;

-- =====================================================
-- STEP 2: CHECK FUNCTIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Checking existing quality check functions...';
    
    -- Check create_quality_check_from_template
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'create_quality_check_from_template'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✅ create_quality_check_from_template function exists';
    ELSE
        RAISE NOTICE '❌ create_quality_check_from_template function does NOT exist';
    END IF;
    
    -- Check complete_quality_check
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'complete_quality_check'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✅ complete_quality_check function exists';
        
        -- Function exists
        RAISE NOTICE '   - Function signature found';
    ELSE
        RAISE NOTICE '❌ complete_quality_check function does NOT exist';
    END IF;
    
    -- Check get_quality_check_summary
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_quality_check_summary'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✅ get_quality_check_summary function exists';
    ELSE
        RAISE NOTICE '❌ get_quality_check_summary function does NOT exist';
    END IF;
    
    -- Check receive_quality_checked_items
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'receive_quality_checked_items'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✅ receive_quality_checked_items function exists';
    ELSE
        RAISE NOTICE '❌ receive_quality_checked_items function does NOT exist';
    END IF;
END $$;

-- =====================================================
-- STEP 3: CHECK DATA
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Checking existing data...';
    
    -- Check if there are any purchase orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_purchase_orders') THEN
        RAISE NOTICE '✅ lats_purchase_orders table exists';
        RAISE NOTICE '   - Total purchase orders: %', (SELECT COUNT(*) FROM lats_purchase_orders);
        
        -- Check for received orders that could have quality checks
        RAISE NOTICE '   - Orders with received status: %', (SELECT COUNT(*) FROM lats_purchase_orders WHERE status = 'received');
    ELSE
        RAISE NOTICE '❌ lats_purchase_orders table does NOT exist';
    END IF;
    
    -- Check if there are any purchase order items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_purchase_order_items') THEN
        RAISE NOTICE '✅ lats_purchase_order_items table exists';
        RAISE NOTICE '   - Total purchase order items: %', (SELECT COUNT(*) FROM lats_purchase_order_items);
    ELSE
        RAISE NOTICE '❌ lats_purchase_order_items table does NOT exist';
    END IF;
END $$;

-- =====================================================
-- STEP 4: SUMMARY
-- =====================================================

DO $$
DECLARE
    table_count INTEGER := 0;
    function_count INTEGER := 0;
BEGIN
    -- Count existing tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('quality_check_templates', 'quality_check_criteria', 'purchase_order_quality_checks', 'purchase_order_quality_check_items');
    
    -- Count existing functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname IN ('create_quality_check_from_template', 'complete_quality_check', 'get_quality_check_summary', 'receive_quality_checked_items')
    AND n.nspname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 SUMMARY:';
    RAISE NOTICE '   - Quality check tables: %/4', table_count;
    RAISE NOTICE '   - Quality check functions: %/4', function_count;
    
    IF table_count = 4 AND function_count = 4 THEN
        RAISE NOTICE '🎉 Quality check system is COMPLETE!';
    ELSIF table_count > 0 OR function_count > 0 THEN
        RAISE NOTICE '⚠️  Quality check system is PARTIALLY SET UP';
        RAISE NOTICE '   - Run FIX_QUALITY_CHECK_SYSTEM_FIXED.sql to complete setup';
    ELSE
        RAISE NOTICE '❌ Quality check system is NOT SET UP';
        RAISE NOTICE '   - Run FIX_QUALITY_CHECK_SYSTEM_FIXED.sql to set up complete system';
    END IF;
END $$;
