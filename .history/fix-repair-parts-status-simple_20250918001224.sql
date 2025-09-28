-- =====================================================
-- SIMPLE FIX FOR REPAIR PARTS STATUS ISSUE
-- =====================================================
-- Run this directly in Supabase SQL Editor

-- 1. Drop existing status constraint
ALTER TABLE repair_parts 
DROP CONSTRAINT IF EXISTS repair_parts_status_check;

-- 2. Add new status constraint that includes 'accepted'
ALTER TABLE repair_parts 
ADD CONSTRAINT repair_parts_status_check 
CHECK (status IN ('needed', 'ordered', 'accepted', 'received', 'used', 'pending', 'completed', 'cancelled', 'processing'));

-- 3. Check current repair parts statuses
SELECT 
  status,
  COUNT(*) as count
FROM repair_parts 
GROUP BY status
ORDER BY status;

-- 4. Check devices with accepted parts
SELECT 
  device_id,
  COUNT(*) as total_parts,
  COUNT(CASE WHEN status IN ('accepted', 'received', 'used') THEN 1 END) as ready_parts,
  COUNT(CASE WHEN status IN ('needed', 'ordered') THEN 1 END) as pending_parts
FROM repair_parts 
GROUP BY device_id
HAVING COUNT(CASE WHEN status = 'accepted' THEN 1 END) > 0
ORDER BY device_id;
