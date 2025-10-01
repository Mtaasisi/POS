-- =====================================================
-- FIX ALL INVENTORY ITEMS MISSING PURCHASE ORDER METADATA
-- =====================================================
-- This script identifies and fixes all inventory items that belong to
-- purchase orders but are missing the purchase_order_id in their metadata

-- STEP 1: Check how many items need fixing
-- =====================================================
SELECT 
    COUNT(*) as total_items_needing_fix,
    COUNT(DISTINCT poi.purchase_order_id) as affected_purchase_orders
FROM inventory_items ii
JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id 
    AND (ii.variant_id = poi.variant_id OR (ii.variant_id IS NULL AND poi.variant_id IS NULL))
WHERE (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '')
AND poi.purchase_order_id IS NOT NULL;

-- Expected: Shows count of items that need metadata fixes


-- STEP 2: Preview items that will be updated
-- =====================================================
SELECT 
    ii.id as inventory_item_id,
    ii.serial_number,
    ii.created_at as item_created,
    ii.metadata,
    poi.purchase_order_id,
    po.order_number,
    p.name as product_name,
    pv.name as variant_name,
    'Will add purchase_order_id to metadata' as action
FROM inventory_items ii
JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id 
    AND (ii.variant_id = poi.variant_id OR (ii.variant_id IS NULL AND poi.variant_id IS NULL))
JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
JOIN lats_products p ON ii.product_id = p.id
LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id
WHERE (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '')
AND poi.purchase_order_id IS NOT NULL
ORDER BY ii.created_at DESC
LIMIT 50;

-- Expected: Shows preview of items that will be updated


-- STEP 3: BACKUP - Create a backup of current metadata before updating
-- =====================================================
CREATE TEMP TABLE IF NOT EXISTS inventory_metadata_backup AS
SELECT 
    ii.id,
    ii.metadata as original_metadata,
    poi.purchase_order_id as will_add_po_id,
    NOW() as backup_time
FROM inventory_items ii
JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id 
    AND (ii.variant_id = poi.variant_id OR (ii.variant_id IS NULL AND poi.variant_id IS NULL))
WHERE (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '')
AND poi.purchase_order_id IS NOT NULL;

-- Verify backup created
SELECT COUNT(*) as backed_up_items FROM inventory_metadata_backup;


-- STEP 4: Apply the fix - Update all items with missing metadata
-- =====================================================
-- This is the main fix - updates metadata to include purchase_order_id
UPDATE inventory_items ii
SET 
    metadata = COALESCE(ii.metadata, '{}'::jsonb) || 
               jsonb_build_object(
                   'purchase_order_id', poi.purchase_order_id::TEXT,
                   'metadata_fixed_at', NOW()::TEXT,
                   'fixed_by', 'auto_fix_script'
               ),
    updated_at = NOW()
FROM lats_purchase_order_items poi
WHERE ii.product_id = poi.product_id 
AND (ii.variant_id = poi.variant_id OR (ii.variant_id IS NULL AND poi.variant_id IS NULL))
AND (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '')
AND poi.purchase_order_id IS NOT NULL;

-- Expected: Updates N rows where N is the count from STEP 1


-- STEP 5: Verify the fix worked
-- =====================================================
SELECT 
    COUNT(*) as items_still_missing_metadata
FROM inventory_items ii
JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id 
    AND (ii.variant_id = poi.variant_id OR (ii.variant_id IS NULL AND poi.variant_id IS NULL))
WHERE (ii.metadata->>'purchase_order_id' IS NULL OR ii.metadata->>'purchase_order_id' = '')
AND poi.purchase_order_id IS NOT NULL;

-- Expected: Should return 0


-- STEP 6: Show updated items with their new metadata
-- =====================================================
SELECT 
    ii.id,
    ii.serial_number,
    p.name as product_name,
    po.order_number,
    ii.metadata->>'purchase_order_id' as po_id_in_metadata,
    ii.metadata->>'metadata_fixed_at' as fixed_timestamp,
    ii.updated_at
FROM inventory_items ii
JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id 
JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
JOIN lats_products p ON ii.product_id = p.id
WHERE ii.metadata->>'metadata_fixed_at' IS NOT NULL
ORDER BY ii.updated_at DESC
LIMIT 20;

-- Expected: Shows recently fixed items


-- STEP 7: Test the function now returns more items
-- =====================================================
-- Replace with actual purchase order IDs from your system
SELECT 
    po.id as purchase_order_id,
    po.order_number,
    COUNT(ii.*) as items_in_inventory
FROM lats_purchase_orders po
LEFT JOIN LATERAL get_received_items_for_po(po.id) ii ON true
WHERE po.status IN ('received', 'partial_received', 'completed')
GROUP BY po.id, po.order_number
ORDER BY po.created_at DESC
LIMIT 10;

-- Expected: Shows purchase orders with their inventory item counts


-- STEP 8: Rollback procedure (if needed)
-- =====================================================
-- ONLY USE THIS IF SOMETHING WENT WRONG!
-- Restores original metadata from backup

/*
UPDATE inventory_items ii
SET 
    metadata = imb.original_metadata,
    updated_at = NOW()
FROM inventory_metadata_backup imb
WHERE ii.id = imb.id;
*/

-- To use rollback:
-- 1. Uncomment the UPDATE statement above
-- 2. Run it
-- 3. Verify with: SELECT COUNT(*) FROM inventory_items WHERE metadata->>'metadata_fixed_at' IS NULL;


-- =====================================================
-- SUMMARY REPORT
-- =====================================================
WITH fix_summary AS (
    SELECT 
        COUNT(*) as total_fixed,
        MIN(updated_at) as first_fix_time,
        MAX(updated_at) as last_fix_time
    FROM inventory_items
    WHERE metadata->>'metadata_fixed_at' IS NOT NULL
),
po_summary AS (
    SELECT 
        COUNT(DISTINCT ii.metadata->>'purchase_order_id') as purchase_orders_affected
    FROM inventory_items ii
    WHERE ii.metadata->>'metadata_fixed_at' IS NOT NULL
)
SELECT 
    fs.total_fixed as items_fixed,
    ps.purchase_orders_affected,
    fs.first_fix_time,
    fs.last_fix_time,
    'Metadata fix completed successfully ✅' as status
FROM fix_summary fs
CROSS JOIN po_summary ps;

-- Expected: Shows summary of what was fixed

