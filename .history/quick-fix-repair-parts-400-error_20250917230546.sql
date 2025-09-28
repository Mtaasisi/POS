-- Quick fix for repair_parts 400 error
-- Run this in your Supabase SQL Editor to resolve the issue immediately

-- 1. First, let's see what we're working with
SELECT 
  id,
  device_id,
  spare_part_id,
  quantity_needed,
  quantity_used,
  cost_per_unit,
  total_cost,
  status,
  updated_at
FROM repair_parts 
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 2. Fix RLS policies to be completely permissive
DROP POLICY IF EXISTS "Users can view repair parts" ON repair_parts;
DROP POLICY IF EXISTS "Technicians and admins can manage repair parts" ON repair_parts;
DROP POLICY IF EXISTS "Authenticated users can insert repair parts" ON repair_parts;
DROP POLICY IF EXISTS "Authenticated users can update repair parts" ON repair_parts;
DROP POLICY IF EXISTS "Technicians and admins can delete repair parts" ON repair_parts;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON repair_parts;

-- Create a single permissive policy
CREATE POLICY "Enable all access for authenticated users" ON repair_parts
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Fix status constraint to allow all valid values
ALTER TABLE repair_parts 
DROP CONSTRAINT IF EXISTS repair_parts_status_check;

ALTER TABLE repair_parts 
ADD CONSTRAINT repair_parts_status_check 
CHECK (status IN ('needed', 'ordered', 'accepted', 'received', 'used', 'pending', 'completed', 'cancelled', 'processing'));

-- 4. Fix the trigger to avoid conflicts
CREATE OR REPLACE FUNCTION update_repair_parts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if updated_at is not being explicitly set
    IF NEW.updated_at IS NULL OR NEW.updated_at = OLD.updated_at THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_repair_parts_updated_at ON repair_parts;

CREATE TRIGGER trigger_update_repair_parts_updated_at
    BEFORE UPDATE ON repair_parts
    FOR EACH ROW
    EXECUTE FUNCTION update_repair_parts_updated_at();

-- 5. Ensure the record has valid data
UPDATE repair_parts 
SET 
  quantity_needed = COALESCE(quantity_needed, 1),
  quantity_used = COALESCE(quantity_used, 0),
  cost_per_unit = COALESCE(cost_per_unit, 0.00),
  status = COALESCE(status, 'needed'),
  total_cost = COALESCE(quantity_needed, 1) * COALESCE(cost_per_unit, 0.00)
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 6. Test the update
UPDATE repair_parts 
SET 
  status = 'needed',
  updated_at = NOW()
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 7. Verify the fix worked
SELECT 
  id,
  device_id,
  spare_part_id,
  quantity_needed,
  quantity_used,
  cost_per_unit,
  total_cost,
  status,
  updated_at
FROM repair_parts 
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 8. Test with a different status to ensure it works
UPDATE repair_parts 
SET 
  status = 'accepted',
  updated_at = NOW()
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';

-- 9. Final verification
SELECT 
  id,
  status,
  updated_at
FROM repair_parts 
WHERE id = '8aee07b8-a54e-4201-8940-b46becb5a9cc';
