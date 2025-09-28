-- TEST QUERIES - NO ERRORS
-- Run these queries immediately to test your database and get real UUIDs

-- ✅ 1. TEST BASIC CONNECTION
-- This should work without any errors
SELECT COUNT(*) as total_sales FROM lats_sales;

-- ✅ 2. GET SAMPLE DATA (No placeholders needed)
-- Get recent sales with basic info
SELECT 
    id,
    sale_number,
    customer_id,
    total_amount,
    status,
    created_at
FROM lats_sales 
ORDER BY created_at DESC 
LIMIT 10;

-- ✅ 3. GET SALES WITH CUSTOMER NAMES (Simple join)
SELECT 
    s.id,
    s.sale_number,
    s.total_amount,
    s.status,
    s.created_at,
    c.name as customer_name,
    c.phone as customer_phone
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC 
LIMIT 10;

-- ✅ 4. GET SALE ITEMS (Simple query)
SELECT 
    si.id,
    si.sale_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    p.name as product_name,
    p.sku as product_sku
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
ORDER BY si.created_at DESC 
LIMIT 10;

-- ✅ 5. GET CUSTOMER INFO
SELECT 
    id,
    name,
    phone,
    email,
    city,
    total_spent,
    points,
    created_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 10;

-- ✅ 6. GET PRODUCT INFO
SELECT 
    id,
    name,
    sku,
    barcode,
    is_active,
    created_at
FROM lats_products 
ORDER BY created_at DESC 
LIMIT 10;

-- ✅ 7. GET PRODUCT VARIANTS
SELECT 
    id,
    product_id,
    name,
    sku,
    attributes,
    created_at
FROM lats_product_variants 
ORDER BY created_at DESC 
LIMIT 10;

-- ✅ 8. TEST ANALYTICS QUERY
SELECT 
    COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_sale,
    MIN(created_at) as first_sale,
    MAX(created_at) as last_sale
FROM lats_sales;

-- ✅ 9. TEST SALES BY STATUS
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM lats_sales 
GROUP BY status
ORDER BY count DESC;

-- ✅ 10. TEST SALES BY PAYMENT METHOD
SELECT 
    payment_method,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY count DESC;

-- ✅ SUCCESS INDICATORS:
-- If all these queries run without errors, your database is working correctly
-- You can now use the patterns from PERMANENT-400-ERROR-FIX.sql
-- Replace the placeholder UUIDs with real ones from these results
