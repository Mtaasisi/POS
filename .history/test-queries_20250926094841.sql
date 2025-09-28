-- TEST QUERIES FOR 400 ERROR FIX
-- Run these queries to verify the solution works

-- Test 1: Check if sales table exists and has data
SELECT 
    'Sales Table Check' as test_name,
    COUNT(*) as total_sales,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as sales_with_customers
FROM lats_sales;

-- Test 2: Check if customers table exists and has data
SELECT 
    'Customers Table Check' as test_name,
    COUNT(*) as total_customers
FROM customers;

-- Test 3: Check if sale items table exists and has data
SELECT 
    'Sale Items Table Check' as test_name,
    COUNT(*) as total_sale_items
FROM lats_sale_items;

-- Test 4: Check if products table exists and has data
SELECT 
    'Products Table Check' as test_name,
    COUNT(*) as total_products
FROM lats_products;

-- Test 5: Check if product variants table exists and has data
SELECT 
    'Product Variants Table Check' as test_name,
    COUNT(*) as total_variants
FROM lats_product_variants;

-- Test 6: Test the basic sales list query (should work)
SELECT 
    'Basic Sales Query Test' as test_name,
    s.id,
    s.sale_number,
    s.customer_id,
    s.total_amount,
    s.status,
    s.created_at,
    c.name as customer_name,
    c.phone as customer_phone
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- Test 7: Test the sale items query (should work)
SELECT 
    'Sale Items Query Test' as test_name,
    si.id,
    si.sale_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    p.name as product_name,
    p.description as product_description,
    pv.name as variant_name,
    pv.sku as variant_sku
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
LIMIT 5;

-- Test 8: Test with specific sale ID (if it exists)
SELECT 
    'Specific Sale Test' as test_name,
    s.id,
    s.sale_number,
    s.customer_id,
    s.total_amount,
    c.name as customer_name
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- Test 9: Test sale items for specific sale (if it exists)
SELECT 
    'Specific Sale Items Test' as test_name,
    si.id,
    si.sale_id,
    si.quantity,
    si.total_price,
    p.name as product_name,
    pv.name as variant_name
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- Test 10: Check for any data integrity issues
SELECT 
    'Data Integrity Check' as test_name,
    COUNT(CASE WHEN s.customer_id IS NOT NULL AND c.id IS NULL THEN 1 END) as orphaned_sales,
    COUNT(CASE WHEN si.sale_id IS NOT NULL AND s.id IS NULL THEN 1 END) as orphaned_sale_items,
    COUNT(CASE WHEN si.product_id IS NOT NULL AND p.id IS NULL THEN 1 END) as orphaned_product_refs,
    COUNT(CASE WHEN si.variant_id IS NOT NULL AND pv.id IS NULL THEN 1 END) as orphaned_variant_refs
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN lats_sale_items si ON s.id = si.sale_id
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id;

-- SUCCESS CRITERIA:
-- 1. All table checks should return counts > 0
-- 2. Basic sales query should return data without errors
-- 3. Sale items query should return data without errors
-- 4. Data integrity check should show 0 orphaned records
-- 5. No 400 Bad Request errors when using these queries in Supabase REST API

-- If any test fails, check:
-- 1. Table permissions
-- 2. Foreign key relationships
-- 3. Data consistency
-- 4. Supabase RLS policies
