-- Diagnose the 400 error for repair_parts record 8aee07b8-a54e-4201-8940-b46becb5a9cc
-- This will help identify what's causing the PATCH operation failure

-- 1. Check the specific record that's failing
SELECT 
  id,
  device_id,
  spare_part_id,
  quantity_needed,
  quantity_used,
  cost_per_unit,
  total_cost,
  status,
  notes,
  created_by,
  updated_by,
  created_at,
  updated_at
FROM repair_parts 
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 2. Check if this record exists
SELECT COUNT(*) as record_exists
FROM repair_parts 
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 3. Check table structure and constraints
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'repair_parts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check all constraints on the table
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'repair_parts' 
  AND tc.table_schema = 'public';

-- 5. Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'repair_parts';

-- 6. Check RLS policies
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
WHERE tablename = 'repair_parts';

-- 7. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'repair_parts';

-- 8. Check if the status value is valid according to constraints
SELECT 
  id,
  status,
  CASE 
    WHEN status IN ('needed', 'ordered', 'accepted', 'received', 'used') 
    THEN 'Valid status'
    ELSE 'Invalid status: ' || COALESCE(status, 'NULL')
  END as status_check
FROM repair_parts 
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 9. Check foreign key references
SELECT 
  id,
  device_id,
  spare_part_id,
  CASE 
    WHEN device_id IS NOT NULL THEN 
      (SELECT COUNT(*) FROM devices WHERE id = device_id)::text || ' device records found'
    ELSE 'device_id is NULL'
  END as device_fk_check,
  CASE 
    WHEN spare_part_id IS NOT NULL THEN 
      (SELECT COUNT(*) FROM lats_spare_parts WHERE id = spare_part_id)::text || ' spare part records found'
    ELSE 'spare_part_id is NULL'
  END as spare_part_fk_check
FROM repair_parts 
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 10. Test a minimal update to isolate the issue
UPDATE repair_parts 
SET updated_at = NOW()
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 11. If that works, test with status
UPDATE repair_parts 
SET 
  status = 'needed',
  updated_at = NOW()
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 12. Check the final state
SELECT 
  id,
  status,
  updated_at
FROM repair_parts 
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';
