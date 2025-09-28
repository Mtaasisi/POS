-- FIX CUSTOMER 0186 DATA ISSUE - ONE LINE FIX
-- This will fix the customer data that's showing Tsh 0 in your application

-- Check current data first
SELECT name, total_spent, points, total_purchases, loyalty_level 
FROM customers 
WHERE phone = '25564000186';

-- Fix the data
UPDATE customers SET
    name = 'PREMIUM CUSTOMER 0186',
    total_spent = 29396000,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 129,
    last_visit = '2023-10-03T16:43:02Z',
    last_purchase_date = '2023-10-03T16:43:02Z',
    updated_at = NOW()
WHERE phone = '25564000186';

-- Verify the fix
SELECT name, total_spent, points, total_purchases, loyalty_level 
FROM customers 
WHERE phone = '25564000186';
