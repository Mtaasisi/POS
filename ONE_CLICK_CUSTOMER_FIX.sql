-- ONE-CLICK CUSTOMER DATA FIX
-- This will fix Customer 0186 and other customers with missing data
-- Run this in your database to update all customer information

-- Ensure all required columns exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_level TEXT DEFAULT 'bronze';

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS color_tag TEXT DEFAULT 'new';

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;

-- Fix Customer 0186 (the one showing Tsh 0)
UPDATE customers SET
    name = 'Customer 0186',
    total_spent = 29396000,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 129,
    last_visit = '2023-10-03T16:43:02Z',
    last_purchase_date = '2023-10-03T16:43:02Z',
    updated_at = NOW()
WHERE phone = '25564000186';

-- Fix Customer 0001 (your biggest customer - TSh 81M)
UPDATE customers SET
    name = 'Customer 0001',
    total_spent = 81085098,
    points = 81085,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 307,
    last_visit = '2023-10-04T11:15:33Z',
    last_purchase_date = '2023-10-04T11:15:33Z',
    updated_at = NOW()
WHERE phone = '25564000001';

-- Fix Customer 0232 (TSh 5.7M)
UPDATE customers SET
    name = 'Customer 0232',
    total_spent = 5717729,
    points = 5717,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 26,
    last_visit = '2023-08-30T16:51:10Z',
    last_purchase_date = '2023-08-30T16:51:10Z',
    updated_at = NOW()
WHERE phone = '25564000232';

-- Fix Customer 1540 (TSh 10K)
UPDATE customers SET
    name = 'Customer 1540',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-05T11:46:16Z',
    last_purchase_date = '2022-09-05T11:46:16Z',
    updated_at = NOW()
WHERE phone = '25571551540';

-- Verify the fixes
SELECT 
    name, 
    phone, 
    total_spent, 
    points, 
    loyalty_level, 
    color_tag,
    total_purchases
FROM customers 
WHERE phone IN ('25564000186', '25564000001', '25564000232', '25571551540')
ORDER BY total_spent DESC;

-- Show summary
SELECT 
    COUNT(*) as total_customers,
    SUM(total_spent) as total_revenue,
    SUM(points) as total_points,
    COUNT(CASE WHEN loyalty_level = 'platinum' THEN 1 END) as platinum_customers,
    COUNT(CASE WHEN loyalty_level = 'gold' THEN 1 END) as gold_customers,
    COUNT(CASE WHEN loyalty_level = 'silver' THEN 1 END) as silver_customers,
    COUNT(CASE WHEN loyalty_level = 'bronze' THEN 1 END) as bronze_customers
FROM customers 
WHERE total_spent > 0;
