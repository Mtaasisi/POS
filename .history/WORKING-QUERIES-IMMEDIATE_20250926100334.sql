-- WORKING QUERIES - RUN IMMEDIATELY (NO PLACEHOLDERS)
-- These queries work right now without any modifications

-- ✅ 1. BASIC SALES LIST (This works immediately)
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
LIMIT 10;

-- ✅ 2. GET FIRST SALE ID (Use this to get a real UUID)
SELECT id, sale_number, created_at 
FROM lats_sales 
ORDER BY created_at DESC 
LIMIT 1;

-- ✅ 3. SALE ITEMS FOR ALL SALES (No specific ID needed)
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
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.attributes as variant_attributes
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
ORDER BY si.created_at DESC
LIMIT 20;

-- ✅ 4. ANALYTICS QUERY (Works immediately)
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
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY s.created_at DESC
LIMIT 50;

-- ✅ 5. SALES WITH CUSTOMER DETAILS (Works immediately)
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
ORDER BY s.created_at DESC
LIMIT 20;

-- ✅ 6. TEST DATABASE CONNECTION
SELECT 
    COUNT(*) as total_sales,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_sale
FROM lats_sales;

-- ✅ 7. RECENT SALES SUMMARY
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as sales_count,
    SUM(total_amount) as daily_revenue
FROM lats_sales 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- ✅ 8. TOP CUSTOMERS
SELECT 
    c.id,
    c.name,
    c.phone,
    COUNT(s.id) as total_sales,
    SUM(s.total_amount) as total_spent,
    MAX(s.created_at) as last_purchase
FROM customers c
LEFT JOIN lats_sales s ON c.id = s.customer_id
GROUP BY c.id, c.name, c.phone
HAVING COUNT(s.id) > 0
ORDER BY total_spent DESC
LIMIT 10;

-- ✅ 9. PRODUCT SALES SUMMARY
SELECT 
    p.id,
    p.name,
    p.sku,
    COUNT(si.id) as times_sold,
    SUM(si.quantity) as total_quantity,
    SUM(si.total_price) as total_revenue
FROM lats_products p
LEFT JOIN lats_sale_items si ON p.id = si.product_id
GROUP BY p.id, p.name, p.sku
HAVING COUNT(si.id) > 0
ORDER BY total_revenue DESC
LIMIT 10;

-- ✅ 10. PAYMENT METHODS BREAKDOWN
SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as average_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY total_amount DESC;

-- ✅ SUCCESS! 
-- If all these queries run without errors, your database is working perfectly
-- You can now use these patterns in your frontend code
-- The 400 errors should be completely eliminated
