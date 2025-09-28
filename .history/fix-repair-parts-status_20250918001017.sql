-- =====================================================
-- FIX REPAIR PARTS STATUS ISSUES
-- =====================================================
-- This fixes the issue where 'accepted' parts are not recognized

-- 1. Check current repair_parts table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'repair_parts' 
ORDER BY ordinal_position;

-- 2. Check current status constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'repair_parts'::regclass 
AND conname LIKE '%status%';

-- 3. Update status constraint to include 'accepted' status
ALTER TABLE repair_parts 
DROP CONSTRAINT IF EXISTS repair_parts_status_check;

ALTER TABLE repair_parts 
ADD CONSTRAINT repair_parts_status_check 
CHECK (status IN ('needed', 'ordered', 'accepted', 'received', 'used', 'pending', 'completed', 'cancelled', 'processing'));

-- 4. Update any existing 'accepted' parts to ensure they're properly recognized
UPDATE repair_parts 
SET status = 'accepted' 
WHERE status = 'accepted';

-- 5. Check current repair parts and their statuses
SELECT 
  status,
  COUNT(*) as count
FROM repair_parts 
GROUP BY status
ORDER BY status;

-- 6. Test the validation by checking parts that should be considered "ready"
SELECT 
  device_id,
  COUNT(*) as total_parts,
  COUNT(CASE WHEN status IN ('accepted', 'received', 'used') THEN 1 END) as ready_parts,
  COUNT(CASE WHEN status IN ('needed', 'ordered') THEN 1 END) as pending_parts
FROM repair_parts 
GROUP BY device_id
ORDER BY device_id;

-- 7. Create a view to easily check parts readiness
CREATE OR REPLACE VIEW repair_parts_readiness AS
SELECT 
  device_id,
  COUNT(*) as total_parts,
  COUNT(CASE WHEN status IN ('accepted', 'received', 'used') THEN 1 END) as ready_parts,
  COUNT(CASE WHEN status IN ('needed', 'ordered') THEN 1 END) as pending_parts,
  CASE 
    WHEN COUNT(*) = 0 THEN 'No parts required'
    WHEN COUNT(CASE WHEN status IN ('accepted', 'received', 'used') THEN 1 END) = COUNT(*) THEN 'All parts ready'
    ELSE CONCAT(
      COUNT(CASE WHEN status IN ('accepted', 'received', 'used') THEN 1 END), 
      '/', 
      COUNT(*), 
      ' parts ready'
    )
  END as readiness_summary
FROM repair_parts 
GROUP BY device_id;

-- 8. Grant permissions on the view
GRANT SELECT ON repair_parts_readiness TO authenticated;
GRANT SELECT ON repair_parts_readiness TO service_role;

-- 9. Test the view
SELECT * FROM repair_parts_readiness LIMIT 10;

-- 10. Create a function to check if device can start repair
CREATE OR REPLACE FUNCTION can_start_repair(device_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  parts_count INTEGER;
  ready_parts INTEGER;
  pending_parts INTEGER;
  result JSONB;
BEGIN
  -- Get parts counts for the device
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status IN ('accepted', 'received', 'used') THEN 1 END),
    COUNT(CASE WHEN status IN ('needed', 'ordered') THEN 1 END)
  INTO parts_count, ready_parts, pending_parts
  FROM repair_parts 
  WHERE device_id = device_id_param;
  
  -- Determine if repair can start
  IF parts_count = 0 THEN
    result := jsonb_build_object(
      'can_start', true,
      'message', 'No parts required',
      'total_parts', parts_count,
      'ready_parts', ready_parts,
      'pending_parts', pending_parts
    );
  ELSIF pending_parts > 0 THEN
    result := jsonb_build_object(
      'can_start', false,
      'message', CONCAT('Cannot start repair. ', pending_parts, ' parts are still pending. Please mark parts as received first.'),
      'total_parts', parts_count,
      'ready_parts', ready_parts,
      'pending_parts', pending_parts
    );
  ELSIF ready_parts = 0 THEN
    result := jsonb_build_object(
      'can_start', false,
      'message', 'No parts have been received yet. Please use the "Parts Received" button to mark parts as received before starting repair.',
      'total_parts', parts_count,
      'ready_parts', ready_parts,
      'pending_parts', pending_parts
    );
  ELSE
    result := jsonb_build_object(
      'can_start', true,
      'message', CONCAT('All ', parts_count, ' parts are ready for repair'),
      'total_parts', parts_count,
      'ready_parts', ready_parts,
      'pending_parts', pending_parts
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 11. Test the function with a sample device
-- SELECT can_start_repair('your-device-id-here'::uuid);

-- 12. Final verification
SELECT 
  'Repair parts status fix applied successfully' as status,
  COUNT(*) as total_repair_parts,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_parts,
  COUNT(CASE WHEN status = 'received' THEN 1 END) as received_parts,
  COUNT(CASE WHEN status = 'used' THEN 1 END) as used_parts,
  COUNT(CASE WHEN status IN ('accepted', 'received', 'used') THEN 1 END) as ready_parts
FROM repair_parts;
