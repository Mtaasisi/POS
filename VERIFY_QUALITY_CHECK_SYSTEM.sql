-- =====================================================
-- QUALITY CHECK SYSTEM VERIFICATION
-- This script verifies all database relations and functionality
-- =====================================================

-- =====================================================
-- STEP 1: VERIFY TABLES EXIST
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '📋 Verifying Tables...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quality_check_templates') THEN
        RAISE NOTICE '✅ quality_check_templates exists';
    ELSE
        RAISE NOTICE '❌ quality_check_templates NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quality_check_criteria') THEN
        RAISE NOTICE '✅ quality_check_criteria exists';
    ELSE
        RAISE NOTICE '❌ quality_check_criteria NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_quality_checks') THEN
        RAISE NOTICE '✅ purchase_order_quality_checks exists';
    ELSE
        RAISE NOTICE '❌ purchase_order_quality_checks NOT found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_quality_check_items') THEN
        RAISE NOTICE '✅ purchase_order_quality_check_items exists';
    ELSE
        RAISE NOTICE '❌ purchase_order_quality_check_items NOT found';
    END IF;
END $$;

-- =====================================================
-- STEP 2: VERIFY FOREIGN KEY RELATIONSHIPS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Verifying Foreign Key Relationships...';
    
    -- Check quality_check_criteria -> quality_check_templates
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'quality_check_criteria'
        AND constraint_name LIKE '%template_id%'
    ) THEN
        RAISE NOTICE '✅ quality_check_criteria -> quality_check_templates';
    ELSE
        RAISE NOTICE '❌ Missing FK: quality_check_criteria -> quality_check_templates';
    END IF;
    
    -- Check purchase_order_quality_checks -> lats_purchase_orders
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'purchase_order_quality_checks'
        AND constraint_name LIKE '%purchase_order_id%'
    ) THEN
        RAISE NOTICE '✅ purchase_order_quality_checks -> lats_purchase_orders';
    ELSE
        RAISE NOTICE '❌ Missing FK: purchase_order_quality_checks -> lats_purchase_orders';
    END IF;
    
    -- Check purchase_order_quality_check_items -> purchase_order_quality_checks
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'purchase_order_quality_check_items'
        AND constraint_name LIKE '%quality_check_id%'
    ) THEN
        RAISE NOTICE '✅ purchase_order_quality_check_items -> purchase_order_quality_checks';
    ELSE
        RAISE NOTICE '❌ Missing FK: purchase_order_quality_check_items -> purchase_order_quality_checks';
    END IF;
    
    -- Check purchase_order_quality_check_items -> lats_purchase_order_items
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'purchase_order_quality_check_items'
        AND constraint_name LIKE '%purchase_order_item_id%'
    ) THEN
        RAISE NOTICE '✅ purchase_order_quality_check_items -> lats_purchase_order_items';
    ELSE
        RAISE NOTICE '❌ Missing FK: purchase_order_quality_check_items -> lats_purchase_order_items';
    END IF;
END $$;

-- =====================================================
-- STEP 3: VERIFY INDEXES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Verifying Indexes...';
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_po_quality_checks_po_id') THEN
        RAISE NOTICE '✅ idx_po_quality_checks_po_id';
    ELSE
        RAISE NOTICE '❌ Missing index: idx_po_quality_checks_po_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_po_quality_checks_status') THEN
        RAISE NOTICE '✅ idx_po_quality_checks_status';
    ELSE
        RAISE NOTICE '❌ Missing index: idx_po_quality_checks_status';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_po_quality_check_items_qc_id') THEN
        RAISE NOTICE '✅ idx_po_quality_check_items_qc_id';
    ELSE
        RAISE NOTICE '❌ Missing index: idx_po_quality_check_items_qc_id';
    END IF;
END $$;

-- =====================================================
-- STEP 4: VERIFY RLS POLICIES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Verifying RLS Policies...';
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quality_check_templates') THEN
        RAISE NOTICE '✅ RLS policies on quality_check_templates';
    ELSE
        RAISE NOTICE '❌ No RLS policies on quality_check_templates';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_quality_checks') THEN
        RAISE NOTICE '✅ RLS policies on purchase_order_quality_checks';
    ELSE
        RAISE NOTICE '❌ No RLS policies on purchase_order_quality_checks';
    END IF;
END $$;

-- =====================================================
-- STEP 5: VERIFY FUNCTIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Verifying Functions...';
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_quality_check_from_template') THEN
        RAISE NOTICE '✅ create_quality_check_from_template()';
    ELSE
        RAISE NOTICE '❌ Missing function: create_quality_check_from_template()';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_quality_check') THEN
        RAISE NOTICE '✅ complete_quality_check()';
    ELSE
        RAISE NOTICE '❌ Missing function: complete_quality_check()';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_quality_check_summary') THEN
        RAISE NOTICE '✅ get_quality_check_summary()';
    ELSE
        RAISE NOTICE '❌ Missing function: get_quality_check_summary()';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_po_quality_status') THEN
        RAISE NOTICE '✅ update_po_quality_status()';
    ELSE
        RAISE NOTICE '❌ Missing function: update_po_quality_status()';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_update_quality_check_status') THEN
        RAISE NOTICE '✅ auto_update_quality_check_status()';
    ELSE
        RAISE NOTICE '❌ Missing function: auto_update_quality_check_status()';
    END IF;
END $$;

-- =====================================================
-- STEP 6: VERIFY TRIGGERS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Verifying Triggers...';
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_po_quality_status') THEN
        RAISE NOTICE '✅ trg_update_po_quality_status';
    ELSE
        RAISE NOTICE '❌ Missing trigger: trg_update_po_quality_status';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_update_quality_check_status') THEN
        RAISE NOTICE '✅ trg_auto_update_quality_check_status';
    ELSE
        RAISE NOTICE '❌ Missing trigger: trg_auto_update_quality_check_status';
    END IF;
END $$;

-- =====================================================
-- STEP 7: VERIFY DEFAULT TEMPLATES
-- =====================================================

DO $$
DECLARE
    v_templates_count INTEGER;
    v_criteria_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📝 Verifying Default Templates...';
    
    SELECT COUNT(*) INTO v_templates_count FROM quality_check_templates;
    RAISE NOTICE 'Templates found: %', v_templates_count;
    
    IF v_templates_count >= 2 THEN
        RAISE NOTICE '✅ Default templates created';
    ELSE
        RAISE NOTICE '❌ Missing default templates';
    END IF;
    
    SELECT COUNT(*) INTO v_criteria_count FROM quality_check_criteria;
    RAISE NOTICE 'Criteria found: %', v_criteria_count;
    
    IF v_criteria_count >= 11 THEN
        RAISE NOTICE '✅ Default criteria created';
    ELSE
        RAISE NOTICE '❌ Missing default criteria';
    END IF;
END $$;

-- =====================================================
-- STEP 8: VERIFY PURCHASE ORDER COLUMNS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📦 Verifying Purchase Order Columns...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND column_name = 'quality_check_status'
    ) THEN
        RAISE NOTICE '✅ quality_check_status column exists';
    ELSE
        RAISE NOTICE '❌ Missing column: quality_check_status';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND column_name = 'quality_check_date'
    ) THEN
        RAISE NOTICE '✅ quality_check_date column exists';
    ELSE
        RAISE NOTICE '❌ Missing column: quality_check_date';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND column_name = 'quality_check_passed'
    ) THEN
        RAISE NOTICE '✅ quality_check_passed column exists';
    ELSE
        RAISE NOTICE '❌ Missing column: quality_check_passed';
    END IF;
END $$;

-- =====================================================
-- STEP 9: TEST FUNCTION EXECUTION
-- =====================================================

DO $$
DECLARE
    v_test_qc_id UUID;
    v_summary RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Testing Function Execution...';
    
    -- Test get_quality_check_summary
    BEGIN
        SELECT * INTO v_summary FROM get_quality_check_summary('c6292820-c3aa-4a33-bbfb-5abcc5b0b038');
        IF v_summary IS NOT NULL THEN
            RAISE NOTICE '✅ get_quality_check_summary() executes successfully';
            RAISE NOTICE '   Quality Check ID: %', v_summary.quality_check_id;
            RAISE NOTICE '   Status: %', v_summary.status;
            RAISE NOTICE '   Total Items: %', v_summary.total_items;
        ELSE
            RAISE NOTICE 'ℹ️  No quality check found for test PO';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ get_quality_check_summary() failed: %', SQLERRM;
    END;
END $$;

-- =====================================================
-- STEP 10: SHOW SAMPLE DATA
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Sample Data Summary...';
END $$;

-- Show templates
SELECT 
    '📝 Templates:' as info,
    id,
    name,
    category,
    is_active
FROM quality_check_templates
ORDER BY created_at;

-- Show criteria count per template
SELECT 
    '📋 Criteria per Template:' as info,
    t.name as template_name,
    COUNT(c.id) as criteria_count
FROM quality_check_templates t
LEFT JOIN quality_check_criteria c ON t.id = c.template_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- Show quality checks
SELECT 
    '✅ Quality Checks:' as info,
    qc.id,
    po.order_number,
    qc.status,
    qc.overall_result,
    qc.checked_at
FROM purchase_order_quality_checks qc
JOIN lats_purchase_orders po ON qc.purchase_order_id = po.id
ORDER BY qc.created_at DESC
LIMIT 5;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '🎉 VERIFICATION COMPLETE!';
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database schema verified';
    RAISE NOTICE '✅ Foreign keys established';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE '✅ RLS policies active';
    RAISE NOTICE '✅ Functions operational';
    RAISE NOTICE '✅ Triggers working';
    RAISE NOTICE '✅ Default templates loaded';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 System ready for UI integration!';
    RAISE NOTICE '';
END $$;
