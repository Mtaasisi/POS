-- =====================================================
-- COMPLETE PURCHASE ORDER SYSTEM FIX & VERIFICATION
-- =====================================================
-- This script fixes all known issues and verifies the entire PO workflow

-- =====================================================
-- STEP 1: FIX OLD INVENTORY ITEMS MISSING METADATA
-- =====================================================

-- Fix inventory items that should be linked to purchase orders
UPDATE inventory_items ii
SET metadata = COALESCE(ii.metadata, '{}'::jsonb) || jsonb_build_object(
    'purchase_order_id', poi.purchase_order_id::TEXT,
    'purchase_order_item_id', poi.id::TEXT,
    'fixed_by_script', true,
    'fixed_at', NOW()::TEXT
)
FROM lats_purchase_order_items poi
WHERE ii.product_id = poi.product_id 
AND (ii.variant_id = poi.variant_id OR (ii.variant_id IS NULL AND poi.variant_id IS NULL))
AND (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '')
AND poi.purchase_order_id IS NOT NULL
AND ii.created_at >= (SELECT created_at FROM lats_purchase_orders WHERE id = poi.purchase_order_id);

-- Verify the fix
SELECT 
    'Fixed Inventory Items' as check_name,
    COUNT(*) as items_fixed
FROM inventory_items
WHERE metadata->>'fixed_by_script' = 'true';


-- =====================================================
-- STEP 2: VERIFY ALL REQUIRED FUNCTIONS EXIST
-- =====================================================

-- Check all critical functions
SELECT 
    'Function Check' as check_name,
    routine_name,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('get_received_items_for_po'),
        ('get_purchase_order_items_with_products'),
        ('update_received_quantities'),
        ('check_purchase_order_completion'),
        ('get_purchase_order_returns'),
        ('receive_quality_checked_items'),
        ('complete_quality_check')
) AS required_functions(func_name)
LEFT JOIN information_schema.routines r 
    ON r.routine_name = required_functions.func_name 
    AND r.routine_schema = 'public';


-- =====================================================
-- STEP 3: CHECK PURCHASE ORDER PAYMENT STATUS
-- =====================================================

-- Verify payment tracking
SELECT 
    po.id,
    po.order_number,
    po.status,
    po.total_amount,
    COALESCE(SUM(pop.amount), 0) as total_paid,
    po.total_amount - COALESCE(SUM(pop.amount), 0) as balance_due,
    CASE 
        WHEN COALESCE(SUM(pop.amount), 0) >= po.total_amount THEN '✅ FULLY PAID'
        WHEN COALESCE(SUM(pop.amount), 0) > 0 THEN '⚠️ PARTIALLY PAID'
        ELSE '❌ UNPAID'
    END as payment_status
FROM lats_purchase_orders po
LEFT JOIN lats_purchase_order_payments pop ON po.id = pop.purchase_order_id AND pop.status = 'completed'
WHERE po.created_at >= NOW() - INTERVAL '90 days'
GROUP BY po.id, po.order_number, po.status, po.total_amount
ORDER BY po.created_at DESC;


-- =====================================================
-- STEP 4: VERIFY QUALITY CHECK WORKFLOW
-- =====================================================

-- Check quality checks and their status
SELECT 
    po.order_number,
    qc.id as quality_check_id,
    qc.status as qc_status,
    qc.overall_result,
    COUNT(qci.id) as total_items_checked,
    SUM(qci.quantity_passed) as total_passed,
    SUM(qci.quantity_failed) as total_failed,
    CASE 
        WHEN qc.status = 'completed' AND SUM(qci.quantity_passed) > 0 THEN 
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM inventory_items ii 
                    WHERE ii.metadata->>'purchase_order_id' = po.id::TEXT
                ) THEN '✅ ITEMS IN INVENTORY'
                ELSE '⚠️ NOT RECEIVED TO INVENTORY'
            END
        WHEN qc.status = 'in_progress' THEN '🔄 IN PROGRESS'
        ELSE '⏸️ PENDING'
    END as workflow_status
FROM lats_purchase_orders po
LEFT JOIN purchase_order_quality_checks qc ON po.id = qc.purchase_order_id
LEFT JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id
WHERE po.created_at >= NOW() - INTERVAL '90 days'
GROUP BY po.id, po.order_number, qc.id, qc.status, qc.overall_result
ORDER BY po.created_at DESC;


-- =====================================================
-- STEP 5: CHECK RECEIVE WORKFLOW INTEGRITY
-- =====================================================

-- Verify receive workflow is complete
WITH po_status AS (
    SELECT 
        po.id,
        po.order_number,
        po.status,
        COUNT(DISTINCT poi.id) as order_items,
        SUM(poi.quantity) as total_ordered,
        SUM(poi.received_quantity) as total_received,
        COUNT(DISTINCT qc.id) as quality_checks,
        COUNT(DISTINCT ii.id) as items_in_inventory
    FROM lats_purchase_orders po
    LEFT JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
    LEFT JOIN purchase_order_quality_checks qc ON po.id = qc.purchase_order_id
    LEFT JOIN inventory_items ii ON ii.metadata->>'purchase_order_id' = po.id::TEXT
    WHERE po.created_at >= NOW() - INTERVAL '90 days'
    GROUP BY po.id, po.order_number, po.status
)
SELECT 
    order_number,
    status,
    order_items,
    total_ordered,
    total_received,
    quality_checks,
    items_in_inventory,
    CASE 
        WHEN status = 'received' AND items_in_inventory > 0 THEN '✅ COMPLETE'
        WHEN status = 'received' AND items_in_inventory = 0 THEN '⚠️ MARKED RECEIVED BUT NO INVENTORY'
        WHEN total_received > 0 AND items_in_inventory = 0 THEN '⚠️ RECEIVED BUT NOT IN INVENTORY'
        WHEN quality_checks > 0 AND items_in_inventory = 0 THEN '⚠️ QUALITY CHECKED, NOT RECEIVED'
        WHEN status IN ('confirmed', 'shipped') THEN '🚚 IN TRANSIT'
        ELSE '📋 PENDING'
    END as workflow_status,
    CASE 
        WHEN status = 'received' AND items_in_inventory = 0 THEN 'Run receive_quality_checked_items function'
        WHEN total_received > 0 AND items_in_inventory = 0 THEN 'Check inventory_items table and metadata'
        ELSE 'No action needed'
    END as recommended_action
FROM po_status
ORDER BY 
    CASE 
        WHEN status = 'received' AND items_in_inventory = 0 THEN 1
        WHEN total_received > 0 AND items_in_inventory = 0 THEN 2
        ELSE 3
    END;


-- =====================================================
-- STEP 6: CHECK FOR ORPHANED/INCOMPLETE DATA
-- =====================================================

-- Find quality check items without inventory items
SELECT 
    'Quality Checked Items Not in Inventory' as issue_type,
    po.order_number,
    qci.id as qc_item_id,
    p.name as product_name,
    qci.quantity_passed,
    'Items passed QC but not in inventory - need to receive' as issue
FROM purchase_order_quality_check_items qci
JOIN purchase_order_quality_checks qc ON qci.quality_check_id = qc.id
JOIN lats_purchase_orders po ON qc.purchase_order_id = po.id
JOIN lats_purchase_order_items poi ON qci.purchase_order_item_id = poi.id
LEFT JOIN lats_products p ON poi.product_id = p.id
WHERE qci.result = 'pass'
AND qci.quantity_passed > 0
AND NOT EXISTS (
    SELECT 1 FROM inventory_items ii
    WHERE ii.metadata->>'purchase_order_id' = po.id::TEXT
    AND ii.product_id = poi.product_id
)
AND po.created_at >= NOW() - INTERVAL '90 days';


-- =====================================================
-- STEP 7: VERIFY RLS POLICIES
-- =====================================================

-- Check all critical RLS policies
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'ALL' THEN '✅ ALL OPERATIONS'
        WHEN cmd = 'SELECT' THEN '👁️ READ ONLY'
        ELSE cmd
    END as permissions,
    CASE 
        WHEN roles::TEXT LIKE '%public%' THEN '🌍 PUBLIC ACCESS'
        WHEN roles::TEXT LIKE '%authenticated%' THEN '🔐 AUTHENTICATED ONLY'
        ELSE roles::TEXT
    END as access_level
FROM pg_policies
WHERE tablename IN (
    'lats_purchase_orders',
    'lats_purchase_order_items',
    'lats_purchase_order_payments',
    'inventory_items',
    'purchase_order_quality_checks',
    'purchase_order_quality_check_items'
)
ORDER BY tablename, policyname;


-- =====================================================
-- STEP 8: PAYMENT VERIFICATION
-- =====================================================

-- Check purchase order payment integrity
SELECT 
    po.order_number,
    po.total_amount,
    COUNT(pop.id) as payment_count,
    SUM(CASE WHEN pop.status = 'completed' THEN pop.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN pop.status = 'pending' THEN pop.amount ELSE 0 END) as pending_payments,
    SUM(CASE WHEN pop.status = 'failed' THEN pop.amount ELSE 0 END) as failed_payments,
    STRING_AGG(DISTINCT pop.payment_method, ', ') as payment_methods,
    CASE 
        WHEN SUM(CASE WHEN pop.status = 'completed' THEN pop.amount ELSE 0 END) >= po.total_amount THEN '✅ PAID'
        WHEN SUM(CASE WHEN pop.status = 'completed' THEN pop.amount ELSE 0 END) > 0 THEN '⚠️ PARTIAL'
        ELSE '❌ UNPAID'
    END as payment_status
FROM lats_purchase_orders po
LEFT JOIN lats_purchase_order_payments pop ON po.id = pop.purchase_order_id
WHERE po.created_at >= NOW() - INTERVAL '90 days'
GROUP BY po.id, po.order_number, po.total_amount
ORDER BY po.created_at DESC;


-- =====================================================
-- STEP 9: GENERATE SUMMARY REPORT
-- =====================================================

-- Overall system health
SELECT 
    'System Health Summary' as report_section,
    (SELECT COUNT(*) FROM lats_purchase_orders WHERE created_at >= NOW() - INTERVAL '90 days') as total_pos_90days,
    (SELECT COUNT(*) FROM lats_purchase_orders WHERE status = 'received' AND created_at >= NOW() - INTERVAL '90 days') as received_pos,
    (SELECT COUNT(*) FROM inventory_items WHERE created_at >= NOW() - INTERVAL '90 days') as inventory_items_90days,
    (SELECT COUNT(*) FROM inventory_items WHERE metadata->>'purchase_order_id' IS NOT NULL) as items_with_po_link,
    (SELECT COUNT(*) FROM purchase_order_quality_checks WHERE status = 'completed') as completed_quality_checks,
    (SELECT SUM(amount) FROM lats_purchase_order_payments WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '90 days') as total_payments_90days;


-- =====================================================
-- STEP 10: RECOMMENDATIONS
-- =====================================================

-- Generate actionable recommendations
SELECT 
    'Recommendations' as section,
    recommendation,
    priority,
    action_sql
FROM (
    SELECT 
        1 as priority,
        'Fix inventory items missing PO metadata' as recommendation,
        'Already fixed above' as action_sql
    WHERE EXISTS (
        SELECT 1 FROM inventory_items 
        WHERE metadata->>'fixed_by_script' = 'true'
    )
    
    UNION ALL
    
    SELECT 
        2 as priority,
        'Receive quality-checked items to inventory' as recommendation,
        'Use receive_quality_checked_items function for pending POs' as action_sql
    WHERE EXISTS (
        SELECT 1 FROM purchase_order_quality_checks qc
        WHERE qc.status = 'completed'
        AND NOT EXISTS (
            SELECT 1 FROM inventory_items ii
            WHERE ii.metadata->>'purchase_order_id' = qc.purchase_order_id::TEXT
        )
    )
    
    UNION ALL
    
    SELECT 
        3 as priority,
        'All systems operational' as recommendation,
        'No action needed' as action_sql
    WHERE NOT EXISTS (
        SELECT 1 FROM purchase_order_quality_checks qc
        WHERE qc.status = 'completed'
        AND NOT EXISTS (
            SELECT 1 FROM inventory_items ii
            WHERE ii.metadata->>'purchase_order_id' = qc.purchase_order_id::TEXT
        )
    )
) AS recommendations
ORDER BY priority;

