-- Fix POS RLS Policy for Sales
-- This migration allows POS sales to be inserted without requiring authentication

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage sales" ON lats_sales;

-- Create a more permissive policy that allows all operations
CREATE POLICY "Allow all operations on sales" ON lats_sales FOR ALL USING (true);

-- Also fix the sale items table
DROP POLICY IF EXISTS "Allow authenticated users to manage sale items" ON lats_sale_items;
CREATE POLICY "Allow all operations on sale items" ON lats_sale_items FOR ALL USING (true);

-- Test insertion to verify the fix works
INSERT INTO lats_sales (sale_number, customer_id, total_amount, payment_method, status, created_by)
VALUES ('TEST-MIGRATION-001', NULL, 1000, 'cash', 'completed', NULL);

-- Clean up test data
DELETE FROM lats_sales WHERE sale_number = 'TEST-MIGRATION-001';
