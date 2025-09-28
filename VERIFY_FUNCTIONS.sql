-- =====================================================
-- VERIFY PURCHASE ORDER FUNCTIONS
-- =====================================================
-- This script verifies that the functions exist and work correctly

-- Step 1: Check if functions exist
SELECT 
    'Function Check' as check_type,
    routine_name,
    routine_type,
    '✅ Function exists' as status
FROM information_schema.routines 
WHERE routine_name IN (
    'get_purchase_order_items_with_products',
    'get_received_items_for_po'
)
AND routine_schema = 'public'
ORDER BY routine_name;

-- Step 2: Test the functions with a sample purchase order ID
-- Replace '2f772843-d993-4987-adb4-393ab0bf718c' with your actual PO ID
DO $$
DECLARE
    test_po_id UUID := '2f772843-d993-4987-adb4-393ab0bf718c';
    items_count INTEGER;
    received_count INTEGER;
BEGIN
    -- Test get_purchase_order_items_with_products
    BEGIN
        SELECT COUNT(*) INTO items_count 
        FROM get_purchase_order_items_with_products(test_po_id);
        
        RAISE NOTICE 'get_purchase_order_items_with_products returned % items', items_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error in get_purchase_order_items_with_products: %', SQLERRM;
    END;
    
    -- Test get_received_items_for_po
    BEGIN
        SELECT COUNT(*) INTO received_count 
        FROM get_received_items_for_po(test_po_id);
        
        RAISE NOTICE 'get_received_items_for_po returned % items', received_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error in get_received_items_for_po: %', SQLERRM;
    END;
END $$;

-- Step 3: Check if the purchase order exists
SELECT 
    'Purchase Order Check' as check_type,
    id,
    order_number,
    status,
    '✅ PO exists' as status
FROM lats_purchase_orders 
WHERE id = '2f772843-d993-4987-adb4-393ab0bf718c';

-- Step 4: Check if there are items for this purchase order
SELECT 
    'Items Check' as check_type,
    COUNT(*) as items_count,
    '✅ Items found' as status
FROM lats_purchase_order_items 
WHERE purchase_order_id = '2f772843-d993-4987-adb4-393ab0bf718c';

-- Step 5: Check table permissions
SELECT 
    'Permission Check' as check_type,
    table_name,
    privilege_type,
    '✅ Permission granted' as status
FROM information_schema.table_privileges 
WHERE table_name IN ('lats_purchase_order_items', 'lats_products', 'lats_product_variants', 'inventory_items', 'lats_inventory_adjustments')
AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;
