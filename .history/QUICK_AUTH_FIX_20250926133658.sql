-- QUICK FIX for 401 Unauthorized Error
-- Run this in your Supabase SQL Editor

-- 1. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Admin can manage lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can view lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can insert lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can update lats_sales" ON lats_sales;

-- 2. Create simple permissive policies for authenticated users
CREATE POLICY "Allow authenticated users to manage lats_sales" ON lats_sales
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Grant explicit permissions
GRANT ALL ON lats_sales TO authenticated;

-- 4. Test the fix
SELECT 'Authentication fix applied - testing access...' as status;

-- Try to insert a test record (this should work now)
INSERT INTO lats_sales (sale_number, customer_id, total_amount, status, created_by)
VALUES ('TEST-' || extract(epoch from now())::text, 
        (SELECT id FROM customers LIMIT 1), 
        1000, 
        'completed', 
        'test_user')
RETURNING id, sale_number, created_at;
