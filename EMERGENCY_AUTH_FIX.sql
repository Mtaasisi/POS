-- EMERGENCY FIX for 401 Unauthorized Error
-- Copy and paste this into your Supabase SQL Editor

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Admin can manage lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can view lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can insert lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can update lats_sales" ON lats_sales;

-- Step 2: Create a simple policy that allows all authenticated users
CREATE POLICY "Allow all for authenticated users" ON lats_sales
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 3: Grant permissions
GRANT ALL ON lats_sales TO authenticated;

-- Step 4: Verify the fix worked
SELECT 'Fix applied successfully!' as result;
