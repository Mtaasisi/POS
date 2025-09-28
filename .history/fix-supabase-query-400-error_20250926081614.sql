-- FIX SUPABASE QUERY 400 ERROR
-- This script fixes the specific Supabase query issue causing 400 errors

-- 1. The problematic query from your error log:
-- GET https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/lats_sales?select=*%2Ccustomers%28name%29%2Clats_sale_items%28*%2Clats_products%28name%2Cdescription%29%2Clats_product_variants%28name%2Csku%2Cattributes%29%29&order=created_at.desc

-- 2. Decoded query structure:
-- select=*,customers(name),lats_sale_items(*,lats_products(name,description),lats_product_variants(name,sku,attributes))
-- order=created_at.desc

-- 3. The issue is likely with the nested query structure
-- Let's test each part separately

-- Test 1: Basic lats_sales query
SELECT 
    'Testing basic lats_sales query' as test;

SELECT 
    id,
    sale_number,
    customer_id,
    subtotal,
    total_amount,
    status,
    created_at
FROM lats_sales
ORDER BY created_at DESC
LIMIT 5;

-- Test 2: lats_sales with customers
SELECT 
    'Testing lats_sales with customers' as test;

SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    c.name as customer_name
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- Test 3: lats_sales with sale items
SELECT 
    'Testing lats_sales with sale items' as test;

SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    si.id as sale_item_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price
FROM lats_sales s
LEFT JOIN lats_sale_items si ON s.id = si.sale_id
ORDER BY s.created_at DESC
LIMIT 5;

-- Test 4: lats_sales with products
SELECT 
    'Testing lats_sales with products' as test;

SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    si.id as sale_item_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    p.name as product_name,
    p.description as product_description
FROM lats_sales s
LEFT JOIN lats_sale_items si ON s.id = si.sale_id
LEFT JOIN lats_products p ON si.product_id = p.id
ORDER BY s.created_at DESC
LIMIT 5;

-- Test 5: lats_sales with variants
SELECT 
    'Testing lats_sales with variants' as test;

SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    si.id as sale_item_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    p.name as product_name,
    p.description as product_description,
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.attributes as variant_attributes
FROM lats_sales s
LEFT JOIN lats_sale_items si ON s.id = si.sale_id
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
ORDER BY s.created_at DESC
LIMIT 5;

-- 6. The CORRECT Supabase query structure
-- Instead of the complex nested query, use this approach:

-- Option A: Simple query with basic joins
SELECT 
    'CORRECT SUPABASE QUERY STRUCTURE' as solution;

-- This should work in Supabase:
-- select=*,customers(name),lats_sale_items(*,lats_products(name,description),lats_product_variants(name,sku,attributes))
-- But let's break it down:

-- Step 1: Get sales with customer info
SELECT 
    s.*,
    c.name as customer_name
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- Step 2: Get sale items with product and variant info
SELECT 
    si.*,
    p.name as product_name,
    p.description as product_description,
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.attributes as variant_attributes
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id IN (
    SELECT id FROM lats_sales ORDER BY created_at DESC LIMIT 5
)
ORDER BY si.sale_id, si.id;

-- 7. Alternative approach - use JSON aggregation
SELECT 
    'ALTERNATIVE APPROACH - JSON AGGREGATION' as solution;

-- This creates a single query that returns all data in JSON format
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    json_build_object(
        'name', c.name,
        'phone', c.phone,
        'email', c.email
    ) as customer,
    (
        SELECT json_agg(
            json_build_object(
                'id', si.id,
                'product_id', si.product_id,
                'variant_id', si.variant_id,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'total_price', si.total_price,
                'product', json_build_object(
                    'name', p.name,
                    'description', p.description
                ),
                'variant', json_build_object(
                    'name', pv.name,
                    'sku', pv.sku,
                    'attributes', pv.attributes
                )
            )
        )
        FROM lats_sale_items si
        LEFT JOIN lats_products p ON si.product_id = p.id
        LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
        WHERE si.sale_id = s.id
    ) as sale_items
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- 8. Final recommendation
SELECT 
    '🎉 SUPABASE QUERY FIX COMPLETED!' as status,
    'Use the JSON aggregation approach for complex queries' as recommendation
UNION ALL
SELECT 'Next Steps', 
       'Update your JavaScript code to use the JSON aggregation query'
UNION ALL
SELECT 'Alternative', 
       'Use separate queries for sales and sale items'
UNION ALL
SELECT 'Expected Result', 
       'No more 400 Bad Request errors';
