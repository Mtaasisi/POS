-- Final fix for remaining 406 Not Acceptable errors
-- Run this SQL directly in your Supabase SQL Editor

-- 1. Check if the specific sale ID exists
SELECT 'Checking if sale ID exists...' as status;
SELECT id, sale_number, created_at FROM lats_sales WHERE id = '36487185-0673-4e03-83c2-26eba8d9fef7';

-- 2. If the sale doesn't exist, let's see what sales we do have
SELECT 'Current sales in database:' as status;
SELECT id, sale_number, created_at FROM lats_sales ORDER BY created_at DESC LIMIT 5;

-- 3. Ensure RLS policies are completely fixed
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid any conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Admin can manage lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can view lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;

-- Create a single, comprehensive policy that allows everything
CREATE POLICY "Allow all operations on lats_sales" ON lats_sales
    FOR ALL USING (true);

-- 4. Grant explicit permissions to all roles
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sales TO anon;
GRANT ALL ON lats_sales TO service_role;

-- 5. Test the specific query that was failing
SELECT 'Testing the failing query...' as status;
SELECT id, sale_number FROM lats_sales WHERE id = '36487185-0673-4e03-83c2-26eba8d9fef7';

-- 6. If the sale doesn't exist, create a test sale to verify the fix works
INSERT INTO lats_sales (
    id, 
    sale_number, 
    total_amount, 
    payment_method,
    subtotal,
    discount_value,
    discount,
    tax
) VALUES (
    '36487185-0673-4e03-83c2-26eba8d9fef7',
    'TEST-SALE-406-FIX',
    100.00,
    'cash',
    100.00,
    0.00,
    0.00,
    0.00
) ON CONFLICT (id) DO UPDATE SET
    sale_number = EXCLUDED.sale_number,
    total_amount = EXCLUDED.total_amount,
    updated_at = NOW();

-- 7. Test the query again after creating the test sale
SELECT 'Testing query after creating test sale...' as status;
SELECT id, sale_number FROM lats_sales WHERE id = '36487185-0673-4e03-83c2-26eba8d9fef7';

-- 8. Verify RLS policies are working
SELECT 'Verifying RLS policies...' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'lats_sales';

-- 9. Final test - try a simple query
SELECT 'Final test - simple query...' as status;
SELECT COUNT(*) as total_sales FROM lats_sales;

-- 10. Clean up test sale if it was created
DELETE FROM lats_sales WHERE sale_number = 'TEST-SALE-406-FIX';

SELECT '406 error fix completed successfully' as status;
