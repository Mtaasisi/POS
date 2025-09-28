-- Check RLS policies on customer_payments table
-- This will help identify if RLS is blocking the update

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'customer_payments';

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
WHERE tablename = 'customer_payments';

-- Check current user context
SELECT 
  current_user,
  session_user,
  current_role;
