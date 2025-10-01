-- =====================================================
-- COMPLETE PURCHASE ORDER WORKFLOW VALIDATION
-- =====================================================
-- This comprehensive script validates the entire PO workflow
-- from order creation through receiving to inventory

-- =====================================================
-- SECTION 1: DATABASE FUNCTIONS CHECK
-- =====================================================

-- Check all required functions exist
SELECT 
    routine_name,
    routine_type,
    'EXISTS ✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_received_items_for_po',
    'receive_quality_checked_items',
    'get_purchase_order_items_with_products',
    'update_received_quantities',
    'get_purchase_order_completion_status',
    'get_purchase_order_returns',
    'complete_quality_check'
)
ORDER BY routine_name;

-- Expected: All 7 functions should be listed


-- =====================================================
-- SECTION 2: TABLE STRUCTURE VALIDATION
-- =====================================================

-- Verify all required tables exist with correct columns
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count,
    'OK ✅' as status
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_name IN (
    'lats_purchase_orders',
    'lats_purchase_order_items',
    'inventory_items',
    'purchase_order_quality_checks',
    'purchase_order_quality_check_items',
    'lats_inventory_adjustments',
    'purchase_order_payments'
)
GROUP BY t.table_name
ORDER BY t.table_name;

-- Expected: 7 tables with their column counts


-- =====================================================
-- SECTION 3: RLS POLICIES CHECK
-- =====================================================

-- Verify RLS policies are in place for critical tables
SELECT 
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Policies Active ✅'
        ELSE 'No Policies ⚠️'
    END as status
FROM pg_policies
WHERE tablename IN (
    'inventory_items',
    'lats_purchase_orders',
    'lats_purchase_order_items',
    'purchase_order_quality_checks'
)
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table should have at least one policy


-- =====================================================
-- SECTION 4: DATA INTEGRITY CHECKS
-- =====================================================

-- Check for orphaned purchase order items (items without a PO)
SELECT 
    'Orphaned PO Items' as check_name,
    COUNT(*) as issue_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK ✅'
        ELSE 'Issues Found ⚠️'
    END as status
FROM lats_purchase_order_items poi
LEFT JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.id IS NULL;

-- Check for inventory items with invalid product references
SELECT 
    'Invalid Product References' as check_name,
    COUNT(*) as issue_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK ✅'
        ELSE 'Issues Found ⚠️'
    END as status
FROM inventory_items ii
LEFT JOIN lats_products p ON ii.product_id = p.id
WHERE p.id IS NULL;

-- Check for quality checks without corresponding PO
SELECT 
    'Orphaned Quality Checks' as check_name,
    COUNT(*) as issue_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK ✅'
        ELSE 'Issues Found ⚠️'
    END as status
FROM purchase_order_quality_checks qc
LEFT JOIN lats_purchase_orders po ON qc.purchase_order_id = po.id
WHERE po.id IS NULL;

-- Check for inventory items missing purchase_order_id in metadata
SELECT 
    'Items Missing PO Metadata' as check_name,
    COUNT(*) as issue_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK ✅'
        ELSE 'Run FIX_ALL_METADATA.sql ⚠️'
    END as status
FROM inventory_items ii
JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id
WHERE (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '');


-- =====================================================
-- SECTION 5: WORKFLOW STATE VALIDATION
-- =====================================================

-- Purchase Orders by Status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(AVG(
        CASE 
            WHEN total_amount > 0 THEN (paid_amount / total_amount) * 100
            ELSE 0
        END
    ), 2) as avg_payment_percentage
FROM lats_purchase_orders
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'draft' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'confirmed' THEN 3
        WHEN 'shipped' THEN 4
        WHEN 'partial_received' THEN 5
        WHEN 'received' THEN 6
        WHEN 'completed' THEN 7
        WHEN 'cancelled' THEN 8
        ELSE 9
    END;

-- Quality Check Status Distribution
SELECT 
    qc.status,
    COUNT(*) as count,
    COUNT(DISTINCT qc.purchase_order_id) as unique_pos,
    ROUND(AVG(
        (SELECT COUNT(*) FROM purchase_order_quality_check_items WHERE quality_check_id = qc.id)
    ), 2) as avg_items_per_check
FROM purchase_order_quality_checks qc
GROUP BY qc.status
ORDER BY qc.status;

-- Inventory Items Status Distribution
SELECT 
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN metadata->>'purchase_order_id' IS NOT NULL THEN 1 END) as with_po_link,
    SUM(cost_price)::DECIMAL(10,2) as total_value
FROM inventory_items
GROUP BY status
ORDER BY count DESC;


-- =====================================================
-- SECTION 6: END-TO-END WORKFLOW TEST
-- =====================================================

-- This query traces the complete workflow for each PO
WITH po_workflow AS (
    SELECT 
        po.id,
        po.order_number,
        po.status as po_status,
        po.created_at as ordered_at,
        
        -- Items
        COUNT(DISTINCT poi.id) as total_items,
        SUM(poi.quantity) as total_ordered_qty,
        SUM(poi.received_quantity) as total_received_qty,
        
        -- Quality Checks
        COUNT(DISTINCT qc.id) as quality_checks_count,
        MAX(qc.status) as latest_qc_status,
        SUM(qci.quantity_passed) as total_passed_qty,
        
        -- Inventory
        COUNT(DISTINCT ii.id) as items_in_inventory,
        
        -- Payments
        COUNT(DISTINCT popm.id) as payment_count,
        SUM(popm.amount) as total_paid,
        po.total_amount,
        
        -- Completion metrics
        CASE 
            WHEN po.status = 'completed' THEN 'Completed ✅'
            WHEN po.status = 'received' THEN 'Received, awaiting completion ⏳'
            WHEN po.status = 'partial_received' THEN 'Partially received ⏳'
            WHEN po.status = 'shipped' THEN 'Shipped, awaiting receipt ⏳'
            WHEN po.status = 'confirmed' THEN 'Confirmed, awaiting shipment ⏳'
            ELSE 'Not yet confirmed ⚠️'
        END as workflow_status
        
    FROM lats_purchase_orders po
    LEFT JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
    LEFT JOIN purchase_order_quality_checks qc ON po.id = qc.purchase_order_id
    LEFT JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id
    LEFT JOIN inventory_items ii ON ii.metadata->>'purchase_order_id' = po.id::TEXT
    LEFT JOIN purchase_order_payments popm ON po.id = popm.purchase_order_id
    
    GROUP BY po.id, po.order_number, po.status, po.created_at, po.total_amount
)
SELECT 
    order_number,
    po_status,
    total_items,
    total_ordered_qty,
    total_received_qty,
    quality_checks_count,
    latest_qc_status,
    total_passed_qty,
    items_in_inventory,
    payment_count,
    total_paid,
    total_amount,
    ROUND((total_paid / NULLIF(total_amount, 0)) * 100, 2) as payment_percentage,
    workflow_status,
    
    -- Workflow validation
    CASE 
        WHEN po_status IN ('received', 'completed') AND items_in_inventory = 0 
            THEN 'ERROR: Marked received but no inventory items ❌'
        WHEN total_received_qty > total_ordered_qty 
            THEN 'ERROR: Received more than ordered ❌'
        WHEN quality_checks_count > 0 AND items_in_inventory = 0 
            THEN 'WARNING: Quality checked but not in inventory ⚠️'
        WHEN total_passed_qty > 0 AND items_in_inventory < total_passed_qty 
            THEN 'WARNING: Some passed items not in inventory ⚠️'
        ELSE 'Workflow valid ✅'
    END as validation_result
    
FROM po_workflow
ORDER BY ordered_at DESC
LIMIT 20;

-- Expected: Shows workflow state and validation for recent POs


-- =====================================================
-- SECTION 7: PERFORMANCE METRICS
-- =====================================================

-- Average time from order to receipt
SELECT 
    ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400), 2) as avg_days_to_receive,
    MIN(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as fastest_receive_days,
    MAX(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as slowest_receive_days,
    COUNT(*) as completed_orders
FROM lats_purchase_orders
WHERE status IN ('received', 'completed')
AND updated_at > created_at;

-- Quality check pass rates
SELECT 
    COUNT(DISTINCT qc.id) as total_quality_checks,
    SUM(qci.quantity_checked) as total_checked,
    SUM(qci.quantity_passed) as total_passed,
    SUM(qci.quantity_failed) as total_failed,
    ROUND((SUM(qci.quantity_passed)::DECIMAL / NULLIF(SUM(qci.quantity_checked), 0)) * 100, 2) as pass_rate_percentage
FROM purchase_order_quality_checks qc
JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id;

-- Inventory turnover
SELECT 
    COUNT(*) as total_inventory_items,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
    COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold,
    COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
    COUNT(CASE WHEN status = 'damaged' THEN 1 END) as damaged,
    ROUND((COUNT(CASE WHEN status = 'sold' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as turnover_rate
FROM inventory_items;


-- =====================================================
-- SECTION 8: RECENT ACTIVITY LOG
-- =====================================================

-- Recent significant events across the workflow
WITH recent_events AS (
    SELECT 
        'Purchase Order Created' as event_type,
        order_number as reference,
        created_at as event_time,
        'PO' as category
    FROM lats_purchase_orders
    WHERE created_at > NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    SELECT 
        'Quality Check Completed' as event_type,
        po.order_number as reference,
        qc.checked_at as event_time,
        'QC' as category
    FROM purchase_order_quality_checks qc
    JOIN lats_purchase_orders po ON qc.purchase_order_id = po.id
    WHERE qc.checked_at > NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    SELECT 
        'Items Added to Inventory' as event_type,
        ii.metadata->>'purchase_order_id' as reference,
        ii.created_at as event_time,
        'INV' as category
    FROM inventory_items ii
    WHERE ii.created_at > NOW() - INTERVAL '7 days'
    AND ii.metadata->>'purchase_order_id' IS NOT NULL
    
    UNION ALL
    
    SELECT 
        'Payment Received' as event_type,
        po.order_number as reference,
        popm.created_at as event_time,
        'PAY' as category
    FROM purchase_order_payments popm
    JOIN lats_purchase_orders po ON popm.purchase_order_id = po.id
    WHERE popm.created_at > NOW() - INTERVAL '7 days'
)
SELECT 
    event_type,
    reference,
    event_time,
    category,
    NOW() - event_time as time_ago
FROM recent_events
ORDER BY event_time DESC
LIMIT 50;


-- =====================================================
-- SECTION 9: SYSTEM HEALTH SUMMARY
-- =====================================================

SELECT 
    'System Health Report' as report_title,
    (SELECT COUNT(*) FROM lats_purchase_orders) as total_purchase_orders,
    (SELECT COUNT(*) FROM lats_purchase_orders WHERE status = 'completed') as completed_orders,
    (SELECT COUNT(*) FROM inventory_items) as total_inventory_items,
    (SELECT COUNT(*) FROM purchase_order_quality_checks) as total_quality_checks,
    (SELECT COUNT(*) FROM purchase_order_payments) as total_payments,
    (SELECT COUNT(*) 
     FROM inventory_items ii
     JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id
     WHERE (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '')
    ) as items_missing_metadata,
    CASE 
        WHEN (SELECT COUNT(*) 
              FROM inventory_items ii
              JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id
              WHERE (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '')
             ) = 0 
        THEN 'All Systems Operational ✅'
        ELSE 'Some Items Need Metadata Fix ⚠️'
    END as overall_status;


-- =====================================================
-- DONE! 
-- =====================================================
-- Review the results from each section above to validate
-- your complete purchase order workflow is functioning correctly.

