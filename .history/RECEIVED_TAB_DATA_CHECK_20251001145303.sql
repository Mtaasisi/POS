-- =====================================================
-- RECEIVED TAB DATA VERIFICATION QUERIES
-- =====================================================
-- Use these queries to verify the received tab is working correctly

-- 1. CHECK IF THE FUNCTION EXISTS
-- =====================================================
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_received_items_for_po';

-- Expected: Should return 1 row showing the function exists


-- 2. CHECK INVENTORY ITEMS TABLE STRUCTURE
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory_items'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected: Should show all columns including metadata (jsonb)


-- 3. CHECK IF INVENTORY ITEMS HAVE PURCHASE ORDER METADATA
-- =====================================================
-- Replace 'YOUR_PO_ID' with actual purchase order ID
SELECT 
    id,
    product_id,
    serial_number,
    status,
    metadata->>'purchase_order_id' as purchase_order_id,
    created_at
FROM inventory_items
WHERE metadata->>'purchase_order_id' IS NOT NULL
LIMIT 10;

-- Expected: Should show inventory items with purchase_order_id in metadata


-- 4. TEST THE get_received_items_for_po FUNCTION
-- =====================================================
-- Replace 'YOUR_PO_ID' with actual purchase order ID
SELECT * FROM get_received_items_for_po('3c6510dc-c025-4a87-9a63-f4083b5b871b'::UUID);

-- Expected: Should return all received items for this purchase order


-- 5. CHECK PURCHASE ORDER STATUS AND ITEMS
-- =====================================================
-- Replace 'YOUR_PO_ID' with actual purchase order ID
SELECT 
    po.id,
    po.order_number,
    po.status,
    COUNT(poi.id) as total_items,
    SUM(poi.quantity) as total_quantity,
    SUM(poi.received_quantity) as total_received
FROM lats_purchase_orders po
LEFT JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'::UUID
GROUP BY po.id, po.order_number, po.status;

-- Expected: Should show purchase order with status and received quantities


-- 6. CHECK IF ITEMS ARE BEING RECEIVED TO INVENTORY
-- =====================================================
-- This checks if there are any inventory adjustments for the PO
SELECT 
    ia.id,
    ia.adjustment_type,
    ia.quantity,
    ia.processed_by,
    ia.created_at,
    p.name as product_name,
    pv.name as variant_name
FROM lats_inventory_adjustments ia
LEFT JOIN lats_products p ON ia.product_id = p.id
LEFT JOIN lats_product_variants pv ON ia.variant_id = pv.id
WHERE ia.purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'::UUID
ORDER BY ia.created_at DESC;

-- Expected: Should show inventory adjustments created when items were received


-- 7. CHECK QUALITY CHECK DATA
-- =====================================================
SELECT 
    qc.id,
    qc.status as quality_check_status,
    qc.overall_result,
    qc.checked_by,
    qc.checked_at,
    COUNT(qci.id) as total_check_items,
    SUM(CASE WHEN qci.result = 'pass' THEN qci.quantity_passed ELSE 0 END) as total_passed,
    SUM(CASE WHEN qci.result = 'fail' THEN qci.quantity_failed ELSE 0 END) as total_failed
FROM purchase_order_quality_checks qc
LEFT JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id
WHERE qc.purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'::UUID
GROUP BY qc.id, qc.status, qc.overall_result, qc.checked_by, qc.checked_at;

-- Expected: Should show quality check status and results


-- 8. CHECK FULL DATA FLOW
-- =====================================================
-- This comprehensive query shows the entire receive workflow
WITH po_summary AS (
    SELECT 
        po.id,
        po.order_number,
        po.status,
        po.created_at as ordered_date
    FROM lats_purchase_orders po
    WHERE po.id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'::UUID
),
items_summary AS (
    SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_ordered,
        SUM(received_quantity) as total_received
    FROM lats_purchase_order_items
    WHERE purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'::UUID
),
quality_summary AS (
    SELECT 
        COUNT(DISTINCT qc.id) as quality_checks_count,
        MAX(qc.status) as latest_qc_status,
        SUM(qci.quantity_passed) as total_passed
    FROM purchase_order_quality_checks qc
    LEFT JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id
    WHERE qc.purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'::UUID
),
inventory_summary AS (
    SELECT 
        COUNT(*) as items_in_inventory
    FROM inventory_items
    WHERE metadata->>'purchase_order_id' = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
)
SELECT 
    po.*,
    i.total_items,
    i.total_ordered,
    i.total_received,
    q.quality_checks_count,
    q.latest_qc_status,
    q.total_passed,
    inv.items_in_inventory,
    CASE 
        WHEN inv.items_in_inventory > 0 THEN 'Items are in inventory ✅'
        WHEN q.total_passed > 0 AND inv.items_in_inventory = 0 THEN 'Quality checked but not received to inventory ⚠️'
        WHEN i.total_received > 0 AND inv.items_in_inventory = 0 THEN 'Marked as received but not in inventory ⚠️'
        ELSE 'No items received yet ℹ️'
    END as status_message
FROM po_summary po
CROSS JOIN items_summary i
CROSS JOIN quality_summary q
CROSS JOIN inventory_summary inv;

-- Expected: Should show a complete overview of the receive workflow


-- 9. FIX: If items are quality checked but not in inventory
-- =====================================================
-- This query will show what items need to be added to inventory
SELECT 
    qci.id as quality_check_item_id,
    poi.id as purchase_order_item_id,
    poi.product_id,
    poi.variant_id,
    qci.quantity_passed,
    poi.cost_price,
    p.name as product_name,
    pv.name as variant_name,
    'Item passed quality check but not in inventory' as issue
FROM purchase_order_quality_check_items qci
JOIN purchase_order_quality_checks qc ON qci.quality_check_id = qc.id
JOIN lats_purchase_order_items poi ON qci.purchase_order_item_id = poi.id
LEFT JOIN lats_products p ON poi.product_id = p.id
LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
WHERE qc.purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'::UUID
AND qci.result = 'pass'
AND qci.quantity_passed > 0
AND NOT EXISTS (
    SELECT 1 FROM inventory_items ii
    WHERE ii.metadata->>'purchase_order_id' = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
    AND ii.product_id = poi.product_id
    AND (poi.variant_id IS NULL OR ii.variant_id = poi.variant_id)
);

-- Expected: Should be empty if all quality-checked items are in inventory


-- 10. CHECK RLS POLICIES ON INVENTORY_ITEMS
-- =====================================================
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'inventory_items';

-- Expected: Should show RLS policies allowing users to read/write inventory items

