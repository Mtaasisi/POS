-- DEBUG SALES DATABASE - Check if sales exist and diagnose issues
-- Run these queries in your Supabase SQL editor to debug the sales issue

-- 1. Check if lats_sales table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sales'
ORDER BY ordinal_position;

-- 2. Check total count of sales
SELECT COUNT(*) as total_sales FROM lats_sales;

-- 3. Check recent sales (last 10)
SELECT 
    id,
    sale_number,
    total_amount,
    status,
    created_at
FROM lats_sales 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check sales by date range (last 7 days)
SELECT 
    COUNT(*) as sales_count,
    SUM(total_amount) as total_amount,
    DATE(created_at) as sale_date
FROM lats_sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- 5. Check if there are any sales items
SELECT COUNT(*) as total_sale_items FROM lats_sale_items;

-- 6. Check recent sale items
SELECT 
    si.id,
    si.sale_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    s.sale_number
FROM lats_sale_items si
JOIN lats_sales s ON si.sale_id = s.id
ORDER BY si.created_at DESC
LIMIT 10;

-- 7. Check for any RLS policies that might be blocking access
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'lats_sales';

-- 8. Check table permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'lats_sales';

-- 9. Create a test sale if none exist
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    created_by,
    notes
) VALUES (
    'TEST-SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    NULL,
    1000.00,
    '{"type": "single", "method": "Cash"}',
    'completed',
    'test-user',
    'Test sale for debugging'
) RETURNING id, sale_number, total_amount, created_at;

-- 10. Check if the test sale was created
SELECT 
    id,
    sale_number,
    total_amount,
    status,
    created_at
FROM lats_sales 
WHERE sale_number LIKE 'TEST-SALE-%'
ORDER BY created_at DESC;
