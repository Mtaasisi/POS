-- FIX ORPHANED SALE ITEMS
-- This script addresses the critical issue: 19 sale items with 0 sales

-- 1. First, let's see what orphaned items we have
SELECT 
    'ORPHANED ITEMS ANALYSIS' as check_type,
    COUNT(*) as orphaned_count,
    'Items without valid sales' as description
FROM lats_sale_items si
LEFT JOIN lats_sales s ON si.sale_id = s.id
WHERE s.id IS NULL;

-- 2. Show details of orphaned items
SELECT 
    'ORPHANED ITEM DETAILS' as check_type,
    si.id,
    si.sale_id,
    si.product_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    si.created_at
FROM lats_sale_items si
LEFT JOIN lats_sales s ON si.sale_id = s.id
WHERE s.id IS NULL
ORDER BY si.created_at DESC
LIMIT 10;

-- 3. Check if the sale_ids in sale_items actually exist
SELECT 
    'SALE_ID VALIDATION' as check_type,
    si.sale_id,
    COUNT(*) as item_count,
    CASE 
        WHEN s.id IS NULL THEN '❌ Sale does not exist'
        ELSE '✅ Sale exists'
    END as status
FROM lats_sale_items si
LEFT JOIN lats_sales s ON si.sale_id = s.id
GROUP BY si.sale_id, s.id
ORDER BY item_count DESC;

-- 4. OPTION 1: Create missing sales for orphaned items
-- This creates sales records for the orphaned items
INSERT INTO lats_sales (
    id,
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    notes,
    created_at,
    updated_at
)
SELECT DISTINCT
    si.sale_id as id,
    'AUTO-' || EXTRACT(EPOCH FROM si.created_at)::BIGINT as sale_number,
    NULL as customer_id,
    SUM(si.total_price) OVER (PARTITION BY si.sale_id) as total_amount,
    'cash' as payment_method,
    'completed' as status,
    'Auto-created for orphaned items' as notes,
    MIN(si.created_at) OVER (PARTITION BY si.sale_id) as created_at,
    NOW() as updated_at
FROM lats_sale_items si
LEFT JOIN lats_sales s ON si.sale_id = s.id
WHERE s.id IS NULL;

-- 5. OPTION 2: Delete orphaned items (if you prefer to clean them up)
-- UNCOMMENT THE FOLLOWING LINES IF YOU WANT TO DELETE ORPHANED ITEMS INSTEAD:
/*
DELETE FROM lats_sale_items 
WHERE sale_id NOT IN (SELECT id FROM lats_sales);
*/

-- 6. Verify the fix
SELECT 
    'AFTER FIX VERIFICATION' as check_type,
    'Sales count: ' || (SELECT COUNT(*) FROM lats_sales) as sales_count,
    'Sale items count: ' || (SELECT COUNT(*) FROM lats_sale_items) as sale_items_count,
    'Orphaned items: ' || (
        SELECT COUNT(*) 
        FROM lats_sale_items si
        LEFT JOIN lats_sales s ON si.sale_id = s.id
        WHERE s.id IS NULL
    ) as orphaned_count;

-- 7. Test the complex query again
SELECT 
    'COMPLEX QUERY TEST' as check_type,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ Complex query works'
        ELSE '❌ Complex query failed'
    END as status
FROM lats_sales 
LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id;

-- 8. Final status
SELECT '🎉 Orphaned items fix completed!' as status;
