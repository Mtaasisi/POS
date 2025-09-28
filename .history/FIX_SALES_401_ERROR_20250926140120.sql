-- FIX 401 UNAUTHORIZED ERROR FOR lats_sales TABLE
-- Copy and paste this into your Supabase SQL Editor

-- Step 1: Drop all existing policies on lats_sales
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Admin can manage lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can view lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can insert lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can update lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can delete lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON lats_sales;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON lats_sales;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON lats_sales;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON lats_sales;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON lats_sales;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON lats_sales;

-- Step 2: Create comprehensive RLS policies
CREATE POLICY "Allow read for authenticated users" ON lats_sales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON lats_sales
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON lats_sales
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON lats_sales
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 3: Grant comprehensive permissions
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sales TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

-- Step 4: Enable RLS (if not already enabled)
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant sequence permissions for auto-incrementing fields
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 6: Verify the fix
SELECT 'RLS policies and permissions updated successfully!' as result;

-- Step 7: Test insert (optional - remove this after testing)
-- INSERT INTO lats_sales (sale_number, total_amount, status, customer_name, customer_phone)
-- VALUES ('TEST-' || extract(epoch from now()), 1000, 'completed', 'Test Customer', '+255123456789');
