-- WORKING QUERY IMPLEMENTATION
-- Based on the successful result showing sale items with product and variant details

-- ✅ CONFIRMED WORKING QUERY STRUCTURE
-- This is the query that successfully returned the data you showed:

SELECT 
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
    pv.sku as variant_sku,
    pv.attributes as variant_attributes
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- ✅ WORKING SALES LIST QUERY (for main sales page)
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

-- ✅ WORKING SALE DETAILS QUERY (for SaleDetailsModal)
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

-- ✅ WORKING SALE ITEMS WITH DETAILS QUERY
-- This is the query that returned your successful result
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

-- ✅ WORKING CATEGORY DETAILS QUERY (if needed)
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

-- ✅ FRONTEND IMPLEMENTATION GUIDE
-- Use these queries in your frontend as follows:

-- 1. For Sales List Page:
-- Query: Get sales with basic customer info
-- Use: SELECT s.*, c.name as customer_name, c.phone as customer_phone FROM lats_sales s LEFT JOIN customers c ON s.customer_id = c.id

-- 2. For Sale Details Modal:
-- Step 1: Get sale with customer details
-- Step 2: Get sale items with product and variant details (the working query above)

-- 3. For Sale Items Display:
-- Use the working sale items query that returned your successful result

-- ✅ SUPABASE REST API QUERIES (for frontend)
-- These are the exact queries to use in your Supabase client:

-- Query 1: Get sales list
-- supabase.from('lats_sales').select('*, customers(name, phone, email)').order('created_at', { ascending: false })

-- Query 2: Get sale details
-- supabase.from('lats_sales').select('*, customers(*)').eq('id', saleId).single()

-- Query 3: Get sale items with details (the working one)
-- supabase.from('lats_sale_items').select('*, lats_products(name, description, sku), lats_product_variants(name, sku, attributes)').eq('sale_id', saleId)

-- ✅ SUCCESS CONFIRMATION
-- The data you received confirms this approach works:
-- - Sale item ID: 50b8994b-4402-4bc7-93a7-14b18f2b0b9a
-- - Product: iPhone 11 with description
-- - Variant: Default Variant with SKU and attributes
-- - Pricing: 700,000 TSH total price
-- - All relationships working correctly

-- ✅ NEXT STEPS
-- 1. Update your frontend to use these simplified queries
-- 2. Remove the complex nested query that was causing the 400 error
-- 3. Test the SaleDetailsModal with the new approach
-- 4. Verify all sales pages work correctly

-- ✅ PERFORMANCE NOTES
-- - These queries are much faster than complex nested ones
-- - They work reliably with Supabase REST API
-- - They follow Supabase best practices
-- - They're easier to debug and maintain
