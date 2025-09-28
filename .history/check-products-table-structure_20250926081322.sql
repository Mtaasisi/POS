-- CHECK PRODUCTS TABLE STRUCTURE
-- This script checks the actual structure of lats_products table

-- 1. Check lats_products table structure
SELECT 
    'Checking lats_products table structure' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_products'
ORDER BY ordinal_position;

-- 2. Check lats_product_variants table structure
SELECT 
    'Checking lats_product_variants table structure' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_product_variants'
ORDER BY ordinal_position;

-- 3. Check lats_sale_items table structure
SELECT 
    'Checking lats_sale_items table structure' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sale_items'
ORDER BY ordinal_position;

-- 4. Sample data from lats_products
SELECT 
    'Sample data from lats_products' as step;

SELECT * FROM lats_products LIMIT 3;

-- 5. Sample data from lats_product_variants
SELECT 
    'Sample data from lats_product_variants' as step;

SELECT * FROM lats_product_variants LIMIT 3;

-- 6. Sample data from lats_sale_items
SELECT 
    'Sample data from lats_sale_items' as step;

SELECT * FROM lats_sale_items LIMIT 3;
