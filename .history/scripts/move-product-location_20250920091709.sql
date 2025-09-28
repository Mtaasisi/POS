-- Script to move a product from shelf position H2 to 01B2
-- This script will:
-- 1. Find the product currently at position H2
-- 2. Verify that position 01B2 exists
-- 3. Update the product's location to 01B2

-- Step 1: Check current products at position H2
SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock_quantity,
    ss.code as current_shelf_code,
    ss.name as current_shelf_name
FROM lats_products p
JOIN lats_store_shelves ss ON p.store_shelf_id = ss.id
WHERE ss.code = 'H2';

-- Step 2: Check if target shelf 01B2 exists
SELECT 
    id,
    code,
    name,
    current_capacity,
    max_capacity,
    (max_capacity - current_capacity) as available_capacity
FROM lats_store_shelves 
WHERE code = '01B2';

-- Step 3: Update products from H2 to 01B2
-- This will automatically trigger the shelf capacity update via the database trigger
UPDATE lats_products 
SET 
    store_shelf_id = (
        SELECT id FROM lats_store_shelves WHERE code = '01B2'
    ),
    updated_at = NOW()
WHERE store_shelf_id = (
    SELECT id FROM lats_store_shelves WHERE code = 'H2'
);

-- Step 4: Verify the move was successful
SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock_quantity,
    ss.code as new_shelf_code,
    ss.name as new_shelf_name
FROM lats_products p
JOIN lats_store_shelves ss ON p.store_shelf_id = ss.id
WHERE ss.code = '01B2';

-- Step 5: Check updated shelf capacities
SELECT 
    code,
    name,
    current_capacity,
    max_capacity,
    (max_capacity - current_capacity) as available_capacity
FROM lats_store_shelves 
WHERE code IN ('H2', '01B2')
ORDER BY code;
