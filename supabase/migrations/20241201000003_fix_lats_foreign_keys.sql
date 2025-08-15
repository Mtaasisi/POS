-- ========================================
-- FIX LATS FOREIGN KEY CONSTRAINTS
-- This migration fixes the missing foreign key relationships
-- that are causing 400 Bad Request errors
-- ========================================

-- Step 1: Add foreign key constraint for lats_sales.customer_id -> customers.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_sales_customer_id_fkey'
        AND table_name = 'lats_sales'
    ) THEN
        ALTER TABLE lats_sales 
        ADD CONSTRAINT lats_sales_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added foreign key constraint: lats_sales.customer_id -> customers.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint lats_sales_customer_id_fkey already exists';
    END IF;
END $$;

-- Step 2: Add foreign key constraint for lats_sales.created_by -> auth.users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_sales_created_by_fkey'
        AND table_name = 'lats_sales'
    ) THEN
        ALTER TABLE lats_sales 
        ADD CONSTRAINT lats_sales_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added foreign key constraint: lats_sales.created_by -> auth.users.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint lats_sales_created_by_fkey already exists';
    END IF;
END $$;

-- Step 3: Add foreign key constraint for lats_sale_items.product_id -> lats_products.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_sale_items_product_id_fkey'
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT lats_sale_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added foreign key constraint: lats_sale_items.product_id -> lats_products.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint lats_sale_items_product_id_fkey already exists';
    END IF;
END $$;

-- Step 4: Add foreign key constraint for lats_sale_items.variant_id -> lats_product_variants.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_sale_items_variant_id_fkey'
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT lats_sale_items_variant_id_fkey 
        FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added foreign key constraint: lats_sale_items.variant_id -> lats_product_variants.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint lats_sale_items_variant_id_fkey already exists';
    END IF;
END $$;

-- Step 5: Test the relationships
SELECT 'Testing relationships...' as status;

-- Test basic sales query
SELECT 
    'Basic sales query:' as test_description,
    COUNT(*) as sales_count
FROM lats_sales;

-- Test sales with customers relationship
SELECT 
    'Sales with customers relationship:' as test_description,
    COUNT(*) as sales_with_customers_count
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id;

-- Test complete relationship (this should work now)
SELECT 
    'Complete relationship test:' as test_description,
    COUNT(*) as complete_relationship_count
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN lats_sale_items si ON s.id = si.sale_id;

-- Success message
SELECT '✅ All foreign key relationships have been established!' as status;
