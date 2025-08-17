-- Fix Categories RLS Policy
-- This migration allows categories to be inserted without requiring authentication

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON lats_categories;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_categories" ON lats_categories;
DROP POLICY IF EXISTS "Allow all access for all users on lats_categories" ON lats_categories;

-- Create a more permissive policy that allows all operations
CREATE POLICY "Allow all operations on categories" ON lats_categories FOR ALL USING (true);

-- Also fix the products table
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON lats_products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_products" ON lats_products;
CREATE POLICY "Allow all operations on products" ON lats_products FOR ALL USING (true);

-- Also fix the product variants table
DROP POLICY IF EXISTS "Allow authenticated users to manage product variants" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_product_variants" ON lats_product_variants;
CREATE POLICY "Allow all operations on product variants" ON lats_product_variants FOR ALL USING (true);

-- Test insertion to verify the fix works
INSERT INTO lats_categories (name, description)
VALUES ('Test Category', 'Test category for migration verification');

-- Clean up test data
DELETE FROM lats_categories WHERE name = 'Test Category';
