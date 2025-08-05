-- Test permissions and RLS policies
-- Run this in your Supabase SQL Editor

-- Check current user
SELECT auth.uid() as current_user_id;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'finance_accounts';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'finance_accounts';

-- Test if we can read the data
SELECT 
    id,
    name,
    type,
    balance,
    is_payment_method,
    payment_icon,
    payment_color,
    payment_description
FROM finance_accounts 
LIMIT 5;

-- Test if we can update (this should work for authenticated users)
UPDATE finance_accounts 
SET payment_description = 'Test update from SQL'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'
AND auth.uid() IS NOT NULL;

-- Check the result
SELECT 
    id,
    name,
    payment_description
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Revert the test
UPDATE finance_accounts 
SET payment_description = 'Mobile money payments (test)'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'; 