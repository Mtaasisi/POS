-- =====================================================
-- CHECK TABLE STRUCTURE
-- =====================================================
-- This script checks the actual structure of the tables

-- Check lats_purchase_order_items table structure
SELECT 
    'lats_purchase_order_items' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_purchase_order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check lats_products table structure
SELECT 
    'lats_products' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check lats_product_variants table structure
SELECT 
    'lats_product_variants' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_product_variants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any items in the purchase order
SELECT 
    'Sample data from lats_purchase_order_items' as info,
    id,
    purchase_order_id,
    product_id,
    variant_id,
    quantity,
    cost_price,
    total_price,
    received_quantity,
    notes,
    created_at,
    updated_at
FROM lats_purchase_order_items 
WHERE purchase_order_id = '2f772843-d993-4987-adb4-393ab0bf718c'
LIMIT 3;
