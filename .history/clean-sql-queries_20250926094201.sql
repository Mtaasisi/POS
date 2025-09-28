-- CLEAN SQL QUERIES ONLY
-- No JavaScript code mixed in - pure SQL for database testing

-- ✅ WORKING SALES LIST QUERY
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

-- ✅ WORKING SALE DETAILS QUERY
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

-- ✅ WORKING SALE ITEMS WITH PRODUCT & VARIANT DETAILS
-- This query successfully returns data like:
-- {
--   "id": "50b8994b-4402-4bc7-93a7-14b18f2b0b9a",
--   "product_name": "iPhone 11",
--   "product_description": "iPhone 11 ni moja ya sumu kali za mwaka",
--   "variant_name": "Default Variant",
--   "variant_sku": "SKU-1756570009436-Q65"
-- }
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

-- ✅ WORKING CATEGORY DETAILS QUERY
-- This query successfully returns data like:
-- {
--   "id": "c45894c0-5560-47ce-b869-ebb77b9861f4",
--   "name": "iPhones",
--   "description": "Apple iPhone smartphones",
--   "color": "#000000",
--   "icon": "smartphone"
-- }
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

-- ✅ TEST ALL QUERIES WORKING
-- Run these queries to verify they work:
-- 1. Sales list query - returns sales with customer names
-- 2. Sale details query - returns specific sale with customer details  
-- 3. Sale items query - returns items with product and variant details
-- 4. Category query - returns category information for products

-- ✅ SUCCESS CONFIRMATION
-- All queries tested and working:
-- - No more 400 Bad Request errors
-- - All relationships properly joined
-- - Data structure matches frontend expectations
-- - Performance is much better than complex nested queries
