-- Check Integrations Table Status
-- Run this in your Supabase SQL Editor to see the current state

-- Check if integrations table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'integrations') 
    THEN '✅ Integrations table exists'
    ELSE '❌ Integrations table does not exist'
  END as table_status;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'integrations'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'integrations';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'integrations';

-- Check existing triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'integrations';

-- Check existing functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%integrations%';

-- Check data in integrations table (if it exists)
SELECT 
  name,
  type,
  provider,
  is_active,
  created_at,
  updated_at
FROM integrations
ORDER BY created_at DESC; 