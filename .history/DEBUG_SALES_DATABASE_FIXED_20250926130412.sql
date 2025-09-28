-- DEBUG SALES DATABASE - FIXED VERSION
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
    created_at,
    created_by
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

-- 9. Create a test sale if none exist (FIXED - using NULL for created_by)
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
    NULL, -- Use NULL instead of string since created_by expects UUID
    'Test sale for debugging'
) RETURNING id, sale_number, total_amount, created_at;

-- 10. Create multiple test sales with different dates
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    created_by,
    notes,
    created_at
) VALUES 
(
    'TEST-SALE-001',
    NULL,
    1500.00,
    '{"type": "single", "method": "Cash"}',
    'completed',
    NULL,
    'Test sale 1',
    NOW() - INTERVAL '1 day'
),
(
    'TEST-SALE-002',
    NULL,
    2500.00,
    '{"type": "single", "method": "Card"}',
    'completed',
    NULL,
    'Test sale 2',
    NOW() - INTERVAL '2 days'
),
(
    'TEST-SALE-003',
    NULL,
    800.00,
    '{"type": "single", "method": "Cash"}',
    'pending',
    NULL,
    'Test sale 3',
    NOW() - INTERVAL '3 days'
),
(
    'TEST-SALE-004',
    NULL,
    3200.00,
    '{"type": "single", "method": "M-Pesa"}',
    'completed',
    NULL,
    'Test sale 4',
    NOW() - INTERVAL '4 days'
),
(
    'TEST-SALE-005',
    NULL,
    1200.00,
    '{"type": "single", "method": "Cash"}',
    'completed',
    NULL,
    'Test sale 5',
    NOW() - INTERVAL '5 days'
);

-- 11. Check if the test sales were created
SELECT 
    id,
    sale_number,
    total_amount,
    status,
    created_at
FROM lats_sales 
WHERE sale_number LIKE 'TEST-SALE-%'
ORDER BY created_at DESC;

-- 12. Get a real user ID if you want to use it for created_by
-- (Only run this if you have users in your auth_users table)
SELECT id, name, email 
FROM auth_users 
LIMIT 1;

-- 13. Create a test sale with a real user ID (if you have users)
-- Replace 'USER_ID_HERE' with an actual UUID from the query above
/*
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    created_by,
    notes
) VALUES (
    'TEST-SALE-WITH-USER-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    NULL,
    2000.00,
    '{"type": "single", "method": "Cash"}',
    'completed',
    'USER_ID_HERE', -- Replace with actual user ID
    'Test sale with user'
) RETURNING id, sale_number, total_amount, created_at;
*/

-- 14. Clean up test sales (run this to remove all test sales)
/*
DELETE FROM lats_sales 
WHERE sale_number LIKE 'TEST-SALE-%';
*/
