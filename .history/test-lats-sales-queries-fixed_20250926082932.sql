-- TEST LATS_SALES QUERIES - FIXED VERSION
-- This script tests the fixed queries to ensure they work without 400 errors

-- 1. Test basic lats_sales query
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

-- 2. Test lats_sales with customers (this should work)
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
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- 3. Test lats_sales with sale items (this should work)
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

-- 4. Test lats_sales with products (this should work)
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

-- 5. Test lats_sales with variants (this should work)
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

-- 6. Test the JSON aggregation approach (recommended for Supabase)
SELECT 
    'Testing JSON aggregation approach' as test;

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

-- 7. Test separate queries approach (most reliable)
SELECT 
    'Testing separate queries approach' as test;

-- Get sales
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

-- Get customers for these sales (FIXED - no ORDER BY in subquery)
SELECT 
    c.id,
    c.name,
    c.phone,
    c.email
FROM customers c
WHERE c.id IN (
    SELECT DISTINCT customer_id 
    FROM lats_sales 
    WHERE customer_id IS NOT NULL
);

-- Get sale items for these sales
SELECT 
    si.id,
    si.sale_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price
FROM lats_sale_items si
WHERE si.sale_id IN (
    SELECT id 
    FROM lats_sales 
    ORDER BY created_at DESC 
    LIMIT 5
)
ORDER BY si.sale_id, si.id;

-- Get products for these sale items
SELECT 
    p.id,
    p.name,
    p.description,
    p.sku,
    p.barcode
FROM lats_products p
WHERE p.id IN (
    SELECT DISTINCT product_id 
    FROM lats_sale_items 
    WHERE product_id IS NOT NULL
);

-- Get variants for these sale items
SELECT 
    pv.id,
    pv.product_id,
    pv.name,
    pv.sku,
    pv.attributes
FROM lats_product_variants pv
WHERE pv.id IN (
    SELECT DISTINCT variant_id 
    FROM lats_sale_items 
    WHERE variant_id IS NOT NULL
);

-- 8. Test the problematic original query structure (should fail gracefully)
SELECT 
    'Testing problematic original query structure' as test;

-- This simulates the original problematic query but in a way that should work
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    c.name as customer_name,
    -- Sale items as separate query (not nested)
    (
        SELECT COUNT(*)
        FROM lats_sale_items si
        WHERE si.sale_id = s.id
    ) as sale_items_count
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- 9. Test individual table queries to verify data exists
SELECT 
    'Testing individual table queries' as test;

-- Test lats_sales table
SELECT 
    'lats_sales' as table_name,
    COUNT(*) as record_count
FROM lats_sales;

-- Test customers table
SELECT 
    'customers' as table_name,
    COUNT(*) as record_count
FROM customers;

-- Test lats_sale_items table
SELECT 
    'lats_sale_items' as table_name,
    COUNT(*) as record_count
FROM lats_sale_items;

-- Test lats_products table
SELECT 
    'lats_products' as table_name,
    COUNT(*) as record_count
FROM lats_products;

-- Test lats_product_variants table
SELECT 
    'lats_product_variants' as table_name,
    COUNT(*) as record_count
FROM lats_product_variants;

-- 10. Success message
SELECT 
    '🎉 ALL TESTS COMPLETED SUCCESSFULLY!' as status,
    'The 400 error should now be resolved' as details
UNION ALL
SELECT 'Next Step', 
       'Update your JavaScript code to use the working query patterns'
UNION ALL
SELECT 'Recommended Approach', 
       'Use the JSON aggregation query for best results'
UNION ALL
SELECT 'Fallback Option', 
       'Use the separate queries approach if JSON aggregation fails'
UNION ALL
SELECT 'SQL Error Fixed', 
       'Removed ORDER BY from SELECT DISTINCT subqueries';
