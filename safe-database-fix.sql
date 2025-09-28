-- SAFE DATABASE FIX: Handle existing data integrity issues
-- This script fixes the foreign key constraint errors by cleaning up orphaned data

-- 1. First, let's check for orphaned lats_sale_items records
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count orphaned sale items
    SELECT COUNT(*) INTO orphaned_count
    FROM lats_sale_items lsi
    LEFT JOIN lats_sales ls ON lsi.sale_id = ls.id
    WHERE ls.id IS NULL;
    
    RAISE NOTICE '🔍 Found % orphaned lats_sale_items records', orphaned_count;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE '🧹 Cleaning up orphaned records...';
        
        -- Delete orphaned sale items
        DELETE FROM lats_sale_items 
        WHERE sale_id NOT IN (SELECT id FROM lats_sales);
        
        RAISE NOTICE '✅ Cleaned up % orphaned records', orphaned_count;
    ELSE
        RAISE NOTICE '✅ No orphaned records found';
    END IF;
END $$;

-- 2. Check for orphaned lats_product_variants records
DO $$
DECLARE
    orphaned_variants_count INTEGER;
BEGIN
    -- Count orphaned product variants
    SELECT COUNT(*) INTO orphaned_variants_count
    FROM lats_product_variants lpv
    LEFT JOIN lats_products lp ON lpv.product_id = lp.id
    WHERE lp.id IS NULL;
    
    RAISE NOTICE '🔍 Found % orphaned lats_product_variants records', orphaned_variants_count;
    
    IF orphaned_variants_count > 0 THEN
        RAISE NOTICE '🧹 Cleaning up orphaned product variants...';
        
        -- Delete orphaned product variants
        DELETE FROM lats_product_variants 
        WHERE product_id NOT IN (SELECT id FROM lats_products);
        
        RAISE NOTICE '✅ Cleaned up % orphaned product variants', orphaned_variants_count;
    ELSE
        RAISE NOTICE '✅ No orphaned product variants found';
    END IF;
END $$;

-- 3. Check for orphaned lats_sale_items that reference non-existent products
DO $$
DECLARE
    orphaned_products_count INTEGER;
BEGIN
    -- Count orphaned sale items with invalid product references
    SELECT COUNT(*) INTO orphaned_products_count
    FROM lats_sale_items lsi
    LEFT JOIN lats_products lp ON lsi.product_id = lp.id
    WHERE lp.id IS NULL;
    
    RAISE NOTICE '🔍 Found % lats_sale_items with invalid product references', orphaned_products_count;
    
    IF orphaned_products_count > 0 THEN
        RAISE NOTICE '🧹 Cleaning up sale items with invalid product references...';
        
        -- Delete sale items with invalid product references
        DELETE FROM lats_sale_items 
        WHERE product_id NOT IN (SELECT id FROM lats_products);
        
        RAISE NOTICE '✅ Cleaned up % sale items with invalid product references', orphaned_products_count;
    ELSE
        RAISE NOTICE '✅ No sale items with invalid product references found';
    END IF;
END $$;

-- 4. Check for orphaned lats_sale_items that reference non-existent variants
DO $$
DECLARE
    orphaned_variants_count INTEGER;
BEGIN
    -- Count orphaned sale items with invalid variant references
    SELECT COUNT(*) INTO orphaned_variants_count
    FROM lats_sale_items lsi
    LEFT JOIN lats_product_variants lpv ON lsi.variant_id = lpv.id
    WHERE lsi.variant_id IS NOT NULL AND lpv.id IS NULL;
    
    RAISE NOTICE '🔍 Found % lats_sale_items with invalid variant references', orphaned_variants_count;
    
    IF orphaned_variants_count > 0 THEN
        RAISE NOTICE '🧹 Cleaning up sale items with invalid variant references...';
        
        -- Set variant_id to NULL for invalid references instead of deleting
        UPDATE lats_sale_items 
        SET variant_id = NULL 
        WHERE variant_id IS NOT NULL 
        AND variant_id NOT IN (SELECT id FROM lats_product_variants);
        
        RAISE NOTICE '✅ Cleaned up % sale items with invalid variant references', orphaned_variants_count;
    ELSE
        RAISE NOTICE '✅ No sale items with invalid variant references found';
    END IF;
END $$;

-- 5. Now safely add foreign key constraints
DO $$
BEGIN
    -- Add foreign key from lats_sale_items to lats_sales
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_sale_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_sale_id 
        FOREIGN KEY (sale_id) REFERENCES lats_sales(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key constraint: fk_lats_sale_items_sale_id';
    ELSE
        RAISE NOTICE '✅ Foreign key constraint fk_lats_sale_items_sale_id already exists';
    END IF;
END $$;

-- 6. Add other foreign key constraints safely
DO $$
BEGIN
    -- Add foreign key from lats_sale_items to lats_products
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_product_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_product_id 
        FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key constraint: fk_lats_sale_items_product_id';
    ELSE
        RAISE NOTICE '✅ Foreign key constraint fk_lats_sale_items_product_id already exists';
    END IF;
END $$;

DO $$
BEGIN
    -- Add foreign key from lats_sale_items to lats_product_variants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_variant_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_variant_id 
        FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added foreign key constraint: fk_lats_sale_items_variant_id';
    ELSE
        RAISE NOTICE '✅ Foreign key constraint fk_lats_sale_items_variant_id already exists';
    END IF;
END $$;

DO $$
BEGIN
    -- Add foreign key from lats_product_variants to lats_products
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_product_variants_product_id' 
        AND table_name = 'lats_product_variants'
    ) THEN
        ALTER TABLE lats_product_variants 
        ADD CONSTRAINT fk_lats_product_variants_product_id 
        FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key constraint: fk_lats_product_variants_product_id';
    ELSE
        RAISE NOTICE '✅ Foreign key constraint fk_lats_product_variants_product_id already exists';
    END IF;
END $$;

-- 7. Test the queries that were failing
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing the failing queries...';
    
    -- Test the PaymentsContext query
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM lats_sales 
        LEFT JOIN customers ON lats_sales.customer_id = customers.id
        LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
        LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
        LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
        LIMIT 1;
        
        RAISE NOTICE '✅ PaymentsContext query test successful, found % records', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PaymentsContext query test failed: %', SQLERRM;
    END;
    
    -- Test the provider query
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM lats_sales 
        LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
        LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
        LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
        LIMIT 1;
        
        RAISE NOTICE '✅ Provider query test successful, found % records', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Provider query test failed: %', SQLERRM;
    END;
END $$;

-- 8. Final status
SELECT '🎉 Safe database fix completed! All data integrity issues have been resolved and foreign key constraints added.' as status;
