-- UPDATE CUSTOMER NAMES WITH TRANSACTION DATA
-- Run this to update your customers with real names and improved descriptions

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

-- Update Customer 0186 (the one you showed) with improved name
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

-- Update Customer 0001 (your biggest customer) with VIP name
UPDATE customers SET
    name = 'VIP CUSTOMER 0001',
    total_spent = 81085098,
    points = 81085,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 307,
    last_visit = '2023-10-04T11:15:33Z',
    last_purchase_date = '2023-10-04T11:15:33Z',
    updated_at = NOW()
WHERE phone = '25564000001';

-- Update Customer 0232 with Gold name
UPDATE customers SET
    name = 'GOLD CUSTOMER 0232',
    total_spent = 5717729,
    points = 5717,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 26,
    last_visit = '2023-08-30T16:51:10Z',
    last_purchase_date = '2023-08-30T16:51:10Z',
    updated_at = NOW()
WHERE phone = '25564000232';

-- Update Customer 1540
UPDATE customers SET
    name = 'CUSTOMER 1540',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-05T11:46:16Z',
    last_purchase_date = '2022-09-05T11:46:16Z',
    updated_at = NOW()
WHERE phone = '25571551540';

-- Update customers with real names from transactions
UPDATE customers SET
    name = 'SIMU KITAA',
    total_spent = 4930000,
    points = 4930,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2023-01-20T21:31:01Z',
    last_purchase_date = '2023-01-20T21:31:01Z',
    updated_at = NOW()
WHERE phone = '25571184504';

UPDATE customers SET
    name = 'INAUZWA ELECTRONICS',
    total_spent = 4363250,
    points = 4363,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 22,
    last_visit = '2024-09-27T12:17:07Z',
    last_purchase_date = '2024-09-27T12:17:07Z',
    updated_at = NOW()
WHERE phone = '25571145721';

UPDATE customers SET
    name = 'RICKY',
    total_spent = 4105000,
    points = 4105,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 4,
    last_visit = '2023-01-12T14:33:12Z',
    last_purchase_date = '2023-01-12T14:33:12Z',
    updated_at = NOW()
WHERE phone = '255657463697';

UPDATE customers SET
    name = 'ABDALLA',
    total_spent = 3790000,
    points = 3790,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2023-02-12T20:07:18Z',
    last_purchase_date = '2023-02-12T20:07:18Z',
    updated_at = NOW()
WHERE phone = '255774195002';

UPDATE customers SET
    name = 'ELIGIUS',
    total_spent = 2675000,
    points = 2675,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 7,
    last_visit = '2023-02-02T12:34:56Z',
    last_purchase_date = '2023-02-02T12:34:56Z',
    updated_at = NOW()
WHERE phone = '255679463945';

-- Verify the updates
SELECT 
    name, 
    phone, 
    total_spent, 
    points, 
    loyalty_level, 
    color_tag,
    total_purchases
FROM customers 
WHERE phone IN (
    '25564000186',  -- Customer 0186
    '25564000001',  -- Customer 0001
    '25564000232',  -- Customer 0232
    '25571184504',  -- SIMU KITAA
    '25571145721',  -- INAUZWA ELECTRONICS
    '255657463697', -- RICKY
    '255774195002', -- ABDALLA
    '255679463945'  -- ELIGIUS
)
ORDER BY total_spent DESC;

-- Show summary of all customers
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
