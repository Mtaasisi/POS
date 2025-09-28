-- =====================================================
-- SIMPLE FUNCTION TEST
-- =====================================================
-- Test the functions with minimal parameters to identify issues

-- Test 1: Check if we can call the functions at all
SELECT 'Testing get_purchase_order_items_with_products...' as test_step;

-- This should work if the function exists
SELECT * FROM get_purchase_order_items_with_products('2f772843-d993-4987-adb4-393ab0bf718c'::UUID) LIMIT 1;

SELECT 'Testing get_received_items_for_po...' as test_step;

-- This should work if the function exists  
SELECT * FROM get_received_items_for_po('2f772843-d993-4987-adb4-393ab0bf718c'::UUID) LIMIT 1;

-- Test 2: Check if the tables exist and have data
SELECT 'Checking lats_purchase_order_items table...' as test_step;
SELECT COUNT(*) as item_count FROM lats_purchase_order_items WHERE purchase_order_id = '2f772843-d993-4987-adb4-393ab0bf718c';

SELECT 'Checking lats_products table...' as test_step;
SELECT COUNT(*) as product_count FROM lats_products LIMIT 1;

SELECT 'Checking inventory_items table...' as test_step;
SELECT COUNT(*) as inventory_count FROM inventory_items LIMIT 1;

SELECT 'Checking lats_inventory_adjustments table...' as test_step;
SELECT COUNT(*) as adjustment_count FROM lats_inventory_adjustments LIMIT 1;
