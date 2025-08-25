-- Migration: Fix LATS RLS Policies
-- This migration fixes the RLS policies that are causing 401 Unauthorized errors

-- =====================================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- =====================================================

-- Drop existing policies for LATS tables
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON lats_products;
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Allow all operations on products" ON lats_products;

DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON lats_categories;
DROP POLICY IF EXISTS "Allow all operations on categories" ON lats_categories;

DROP POLICY IF EXISTS "Allow authenticated users to manage brands" ON lats_brands;

DROP POLICY IF EXISTS "Allow authenticated users to manage suppliers" ON lats_suppliers;
DROP POLICY IF EXISTS "Allow all operations on suppliers" ON lats_suppliers;

DROP POLICY IF EXISTS "Allow authenticated users to manage product variants" ON lats_product_variants;
DROP POLICY IF EXISTS "Allow all operations on product variants" ON lats_product_variants;

DROP POLICY IF EXISTS "Allow authenticated users to manage sales" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on sales" ON lats_sales;

DROP POLICY IF EXISTS "Allow authenticated users to manage sale items" ON lats_sale_items;
DROP POLICY IF EXISTS "Allow all operations on sale items" ON lats_sale_items;

-- =====================================================
-- CREATE PERMISSIVE POLICIES FOR DEVELOPMENT
-- =====================================================

-- Products - Allow all operations for all users
CREATE POLICY "Enable all access for all users on lats_products" 
ON lats_products FOR ALL USING (true);

-- Categories - Allow all operations for all users
CREATE POLICY "Enable all access for all users on lats_categories" 
ON lats_categories FOR ALL USING (true);

-- Brands - Allow all operations for all users
CREATE POLICY "Enable all access for all users on lats_brands" 
ON lats_brands FOR ALL USING (true);

-- Suppliers - Allow all operations for all users
CREATE POLICY "Enable all access for all users on lats_suppliers" 
ON lats_suppliers FOR ALL USING (true);

-- Product Variants - Allow all operations for all users
CREATE POLICY "Enable all access for all users on lats_product_variants" 
ON lats_product_variants FOR ALL USING (true);

-- Sales - Allow all operations for all users
CREATE POLICY "Enable all access for all users on lats_sales" 
ON lats_sales FOR ALL USING (true);

-- Sale Items - Allow all operations for all users
CREATE POLICY "Enable all access for all users on lats_sale_items" 
ON lats_sale_items FOR ALL USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users
GRANT ALL ON lats_products TO authenticated;
GRANT ALL ON lats_categories TO authenticated;
GRANT ALL ON lats_brands TO authenticated;
GRANT ALL ON lats_suppliers TO authenticated;
GRANT ALL ON lats_product_variants TO authenticated;
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sale_items TO authenticated;

-- Also grant to anon for development
GRANT ALL ON lats_products TO anon;
GRANT ALL ON lats_categories TO anon;
GRANT ALL ON lats_brands TO anon;
GRANT ALL ON lats_suppliers TO anon;
GRANT ALL ON lats_product_variants TO anon;
GRANT ALL ON lats_sales TO anon;
GRANT ALL ON lats_sale_items TO anon;

-- =====================================================
-- VERIFY POLICIES WERE CREATED
-- =====================================================

-- Check that policies were created successfully
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename LIKE 'lats_%' 
    AND policyname LIKE 'Enable all access for all users%';
    
    IF policy_count >= 7 THEN
        RAISE NOTICE '✅ Successfully created % LATS RLS policies', policy_count;
    ELSE
        RAISE NOTICE '⚠️ Only created % LATS RLS policies (expected 7)', policy_count;
    END IF;
END $$;

-- =====================================================
-- TEST DATA ACCESS
-- =====================================================

-- Test that we can access the tables
DO $$
DECLARE
    product_count INTEGER;
    category_count INTEGER;
    brand_count INTEGER;
    supplier_count INTEGER;
BEGIN
    -- Test products table
    SELECT COUNT(*) INTO product_count FROM lats_products;
    RAISE NOTICE '📦 lats_products: % records accessible', product_count;
    
    -- Test categories table
    SELECT COUNT(*) INTO category_count FROM lats_categories;
    RAISE NOTICE '📂 lats_categories: % records accessible', category_count;
    
    -- Test brands table
    SELECT COUNT(*) INTO brand_count FROM lats_brands;
    RAISE NOTICE '🏷️ lats_brands: % records accessible', brand_count;
    
    -- Test suppliers table
    SELECT COUNT(*) INTO supplier_count FROM lats_suppliers;
    RAISE NOTICE '🏪 lats_suppliers: % records accessible', supplier_count;
END $$;
