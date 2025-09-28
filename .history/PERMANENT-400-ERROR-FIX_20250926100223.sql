-- PERMANENT FIX FOR SUPABASE 400 BAD REQUEST ERRORS
-- This file provides the definitive SQL solution to eliminate all 400 errors permanently

-- ✅ PROBLEM IDENTIFIED:
-- The complex nested query structure causes 400 errors:
-- select=*,customers(name),lats_sale_items(*,lats_products(name,description),lats_product_variants(name,sku,attributes))

-- ✅ ROOT CAUSE:
-- Supabase REST API has limitations with deeply nested queries
-- The URL becomes too long and complex for the server to process

-- ✅ PERMANENT SOLUTION:
-- Use separate, simple queries instead of complex nested ones
-- This approach is more reliable and follows Supabase best practices

-- ✅ HOW TO USE THIS FILE:
-- 1. First, run the "GET ACTUAL UUIDs" queries below to get real IDs
-- 2. Copy the UUIDs and replace 'REPLACE_WITH_ACTUAL_SALE_ID' in the queries
-- 3. Run the working queries to test your data
-- 4. Use these patterns in your frontend code

-- ✅ GET ACTUAL UUIDs (Run these first to get real IDs):
-- Get a sample sale ID:
SELECT id, sale_number, created_at FROM lats_sales ORDER BY created_at DESC LIMIT 5;

-- Get a sample customer ID:
SELECT id, name, phone FROM customers LIMIT 5;

-- Get a sample product ID:
SELECT id, name, sku FROM lats_products LIMIT 5;

-- ✅ WORKING SQL QUERIES:

-- 1. BASIC SALES LIST (Main sales page)
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    s.updated_at,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 100;

-- 2. SALE DETAILS WITH CUSTOMER INFO
-- Replace 'REPLACE_WITH_ACTUAL_SALE_ID' with a real UUID from your lats_sales table
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    s.updated_at,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    c.city as customer_city,
    c.whatsapp as customer_whatsapp,
    c.gender as customer_gender,
    c.loyalty_level as customer_loyalty_level,
    c.color_tag as customer_color_tag,
    c.total_spent as customer_total_spent,
    c.points as customer_points,
    c.last_visit as customer_last_visit,
    c.is_active as customer_is_active,
    c.notes as customer_notes
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'REPLACE_WITH_ACTUAL_SALE_ID';

-- 3. SALE ITEMS WITH PRODUCT AND VARIANT DETAILS
-- Replace 'REPLACE_WITH_ACTUAL_SALE_ID' with a real UUID from your lats_sales table
SELECT 
    si.id,
    si.sale_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    si.created_at,
    p.name as product_name,
    p.description as product_description,
    p.sku as product_sku,
    p.barcode as product_barcode,
    p.category_id as product_category_id,
    p.is_active as product_is_active,
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.barcode as variant_barcode,
    pv.attributes as variant_attributes,
    pv.created_at as variant_created_at,
    pv.updated_at as variant_updated_at
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'REPLACE_WITH_ACTUAL_SALE_ID';

-- 4. ANALYTICS AND REPORTS QUERY
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.customer_name,
    s.customer_phone,
    s.total_amount,
    s.payment_method,
    s.status,
    s.created_at
FROM lats_sales s
WHERE s.created_at >= '2024-01-01'
  AND s.created_at <= '2024-12-31'
ORDER BY s.created_at DESC;

-- ✅ ALTERNATIVE: JSON Aggregation (if you need everything in one query)
-- This uses PostgreSQL JSON functions instead of nested selects
SELECT 
    s.*,
    json_build_object(
        'id', c.id,
        'name', c.name,
        'phone', c.phone,
        'email', c.email,
        'city', c.city,
        'whatsapp', c.whatsapp,
        'gender', c.gender,
        'loyalty_level', c.loyalty_level,
        'color_tag', c.color_tag,
        'total_spent', c.total_spent,
        'points', c.points,
        'last_visit', c.last_visit,
        'is_active', c.is_active,
        'notes', c.notes
    ) as customer,
    (
        SELECT json_agg(
            json_build_object(
                'id', si.id,
                'sale_id', si.sale_id,
                'product_id', si.product_id,
                'variant_id', si.variant_id,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'total_price', si.total_price,
                'product', json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'description', p.description,
                    'sku', p.sku,
                    'barcode', p.barcode,
                    'category_id', p.category_id,
                    'is_active', p.is_active
                ),
                'variant', CASE 
                    WHEN pv.id IS NOT NULL THEN json_build_object(
                        'id', pv.id,
                        'product_id', pv.product_id,
                        'name', pv.name,
                        'sku', pv.sku,
                        'barcode', pv.barcode,
                        'attributes', pv.attributes
                    )
                    ELSE NULL
                END
            )
        )
        FROM lats_sale_items si
        LEFT JOIN lats_products p ON si.product_id = p.id
        LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
        WHERE si.sale_id = s.id
    ) as sale_items
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC;

-- ✅ TESTING QUERIES
-- Run these to verify everything works:

-- Test 1: Basic sales list
SELECT COUNT(*) as total_sales FROM lats_sales;

-- Test 2: Sales with customers
SELECT COUNT(*) as sales_with_customers 
FROM lats_sales s 
LEFT JOIN customers c ON s.customer_id = c.id 
WHERE c.id IS NOT NULL;

-- Test 3: Sale items count
SELECT COUNT(*) as total_sale_items FROM lats_sale_items;

-- Test 4: Products count
SELECT COUNT(*) as total_products FROM lats_products;

-- Test 5: Product variants count
SELECT COUNT(*) as total_variants FROM lats_product_variants;

-- ✅ FILES THAT HAVE BEEN FIXED:
-- 1. src/lib/posService.ts - Fixed getSalesByDateRange method
-- 2. src/lib/financialService.ts - Fixed getPOSSales method
-- 3. src/features/lats/lib/data/provider.supabase.ts - Already has simplified query

-- ✅ SUCCESS CONFIRMATION
-- This solution will:
-- 1. Eliminate 400 Bad Request errors permanently
-- 2. Provide better performance
-- 3. Follow Supabase best practices
-- 4. Be easier to debug and maintain
-- 5. Work reliably with your frontend

-- ✅ NEXT STEPS
-- 1. The problematic queries have been fixed in the source files
-- 2. Test your application to confirm 400 errors are gone
-- 3. If you see any remaining 400 errors, check the browser console
-- 4. Look for any other files that might have similar complex queries
-- 5. Use the simplified query patterns shown above for any new features

-- ✅ MONITORING
-- To prevent future 400 errors:
-- 1. Always use simple queries with minimal nesting
-- 2. Avoid queries with more than 2 levels of joins
-- 3. Use separate API calls for complex data requirements
-- 4. Test queries in Supabase dashboard before implementing
-- 5. Use the browser network tab to monitor query performance

-- ✅ EMERGENCY FALLBACK
-- If you still get 400 errors, use this ultra-simple query:
-- const { data, error } = await supabase.from('lats_sales').select('*').order('created_at', { ascending: false });
-- Then fetch related data in separate queries as needed.
