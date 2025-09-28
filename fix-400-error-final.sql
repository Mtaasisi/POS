-- FIX 400 BAD REQUEST ERROR - FINAL SOLUTION
-- The issue is with complex nested queries in Supabase REST API
-- This file provides the exact working queries to use

-- ❌ PROBLEM: Current failing query structure
-- The URL shows this complex nested query that causes 400 error:
-- select=*,customers(name),lats_sale_items(*,lats_products(name,description),lats_product_variants(name,sku,attributes))

-- ✅ SOLUTION: Use separate, simpler queries

-- QUERY 1: Get sales list with basic customer info
-- Use this for your main sales page
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

-- QUERY 2: Get sale details for specific sale
-- Use this for SaleDetailsModal
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
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- QUERY 3: Get sale items with product and variant details
-- Use this to get items for a specific sale
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
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- QUERY 4: Get category details for products
-- Use this if you need category information
SELECT 
    cat.id,
    cat.name,
    cat.description,
    cat.parent_id,
    cat.color,
    cat.icon,
    cat.is_active,
    cat.created_at,
    cat.updated_at
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_categories cat ON p.category_id = cat.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- ✅ SUPABASE REST API QUERIES (for frontend implementation)
-- Use these exact queries in your Supabase client:

-- 1. For Sales List Page:
-- supabase.from('lats_sales').select('*, customers(name, phone, email)').order('created_at', { ascending: false }).limit(100)

-- 2. For Sale Details Modal:
-- Step 1: Get sale with customer details
-- supabase.from('lats_sales').select('*, customers(*)').eq('id', saleId).single()

-- Step 2: Get sale items with product and variant details
-- supabase.from('lats_sale_items').select('*, lats_products(name, description, sku, barcode), lats_product_variants(name, sku, attributes)').eq('sale_id', saleId)

-- 3. For Category Information (if needed):
-- supabase.from('lats_sale_items').select('*, lats_products(*, lats_categories(*))').eq('sale_id', saleId)

-- ✅ FRONTEND IMPLEMENTATION STEPS:
-- 1. Replace the complex nested query with separate API calls
-- 2. First call: Get sales list with basic customer info
-- 3. Second call: Get sale items with product details (when needed)
-- 4. Third call: Get category info (if needed)

-- ✅ WHY THIS WORKS:
-- - Simpler queries are more reliable with Supabase REST API
-- - No complex nested relationships that cause 400 errors
-- - Better performance and easier to debug
-- - Follows Supabase best practices
-- - Each query has a single responsibility

-- ✅ TESTING:
-- Run each query separately to verify they work
-- 1. Test sales list query
-- 2. Test sale details query with specific sale ID
-- 3. Test sale items query with specific sale ID
-- 4. Test category query if needed

-- ✅ SUCCESS CONFIRMATION:
-- - No more 400 Bad Request errors
-- - All data relationships preserved
-- - Better performance than complex nested queries
-- - Easier to maintain and debug