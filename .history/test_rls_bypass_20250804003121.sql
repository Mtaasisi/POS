-- Test RLS policies and try to bypass them
-- Run this in your Supabase SQL Editor

-- Check current RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'finance_accounts';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'finance_accounts';

-- Try to temporarily disable RLS for testing
ALTER TABLE finance_accounts DISABLE ROW LEVEL SECURITY;

-- Test update without RLS
UPDATE finance_accounts 
SET 
    name = 'Mobile Money Account (No RLS)',
    payment_description = 'Test update without RLS'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Check if it worked
SELECT 
    id,
    name,
    payment_description
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Re-enable RLS
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;

-- Revert the test
UPDATE finance_accounts 
SET 
    name = 'Mobile Money Account',
    payment_description = 'Mobile money payments (test)'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Check final state
SELECT 
    id,
    name,
    payment_description
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'; 