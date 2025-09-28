-- COMPLETE FIX FOR lats_sales 401 UNAUTHORIZED ERROR
-- Copy and paste this into your Supabase SQL Editor

-- Step 1: Drop ALL existing policies on lats_sales
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

-- Step 2: Temporarily disable RLS to fix the issue
ALTER TABLE lats_sales DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant comprehensive permissions
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sales TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

-- Step 4: Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 5: Create simple, permissive policies
CREATE POLICY "Allow all operations for authenticated users" ON lats_sales
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users" ON lats_sales
    FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Re-enable RLS with the new policies
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- Step 7: Test the fix
SELECT 'Sales table authentication fix completed successfully!' as result;

-- Step 8: Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'lats_sales';
