-- Fix RLS Policies for Spare Parts
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON spare_parts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON spare_parts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON spare_parts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON spare_parts;

DROP POLICY IF EXISTS "Enable read access for all users" ON spare_parts_usage;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON spare_parts_usage;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON spare_parts_usage;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON spare_parts_usage;

-- Create new policies that allow anonymous read access
CREATE POLICY "Enable read access for all users" ON spare_parts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON spare_parts_usage FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts_usage FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts_usage FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts_usage FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('spare_parts', 'spare_parts_usage')
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS policies updated successfully!' as status; 

-- Fix RLS policies for finance_accounts table
-- Run this in your Supabase SQL Editor

-- First, check current policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'finance_accounts';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can insert finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can update finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can delete finance accounts" ON finance_accounts;

-- Create new policies for authenticated users
-- Policy for viewing finance accounts
CREATE POLICY "Users can view finance accounts" ON finance_accounts
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for inserting finance accounts
CREATE POLICY "Users can insert finance accounts" ON finance_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating finance accounts
CREATE POLICY "Users can update finance accounts" ON finance_accounts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for deleting finance accounts
CREATE POLICY "Users can delete finance accounts" ON finance_accounts
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Verify the policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'finance_accounts'
ORDER BY policyname;

-- Test the policies by trying to update an account
UPDATE finance_accounts 
SET 
    name = 'Mobile Money Account (RLS Test)',
    payment_description = 'Test update with RLS policies'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'
AND auth.uid() IS NOT NULL;

-- Check if the update worked
SELECT 
    id,
    name,
    payment_description
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Revert the test
UPDATE finance_accounts 
SET 
    name = 'Mobile Money Account',
    payment_description = 'Mobile money payments (test)'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'; 