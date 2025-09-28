-- Fix Status Constraint Violation in lats_sales Table
-- This script will identify invalid status values and fix them before adding the constraint

-- Step 1: Check what status values currently exist in the table
SELECT 
    'Current status values in lats_sales:' as info,
    status,
    COUNT(*) as count
FROM lats_sales 
GROUP BY status 
ORDER BY status;

-- Step 2: Check if there are any NULL status values
SELECT 
    'NULL status values:' as info,
    COUNT(*) as count
FROM lats_sales 
WHERE status IS NULL;

-- Step 3: Update invalid status values to valid ones
-- Common mappings for invalid status values:
-- 'active' -> 'pending'
-- 'inactive' -> 'cancelled' 
-- 'done' -> 'completed'
-- 'failed' -> 'cancelled'
-- 'success' -> 'completed'
-- 'error' -> 'cancelled'
-- 'processing' -> 'pending'
-- 'delivered' -> 'completed'
-- 'shipped' -> 'completed'
-- 'returned' -> 'refunded'
-- 'refund' -> 'refunded'
-- 'cancel' -> 'cancelled'
-- 'complete' -> 'completed'
-- 'pending' -> 'pending' (already valid)
-- 'completed' -> 'completed' (already valid)
-- 'cancelled' -> 'cancelled' (already valid)
-- 'refunded' -> 'refunded' (already valid)

-- Update common invalid status values
UPDATE lats_sales 
SET status = 'pending'
WHERE status IN ('active', 'processing', 'new', 'open', 'waiting');

UPDATE lats_sales 
SET status = 'completed'
WHERE status IN ('done', 'success', 'delivered', 'shipped', 'complete', 'finished', 'closed');

UPDATE lats_sales 
SET status = 'cancelled'
WHERE status IN ('inactive', 'failed', 'error', 'cancel', 'cancelled', 'aborted', 'rejected');

UPDATE lats_sales 
SET status = 'refunded'
WHERE status IN ('returned', 'refund', 'refunded', 'reversed');

-- Handle NULL status values (set to 'pending' as default)
UPDATE lats_sales 
SET status = 'pending'
WHERE status IS NULL;

-- Step 4: Verify all status values are now valid
SELECT 
    'Status values after cleanup:' as info,
    status,
    COUNT(*) as count
FROM lats_sales 
GROUP BY status 
ORDER BY status;

-- Step 5: Check for any remaining invalid status values
SELECT 
    'Invalid status values (should be empty):' as info,
    status,
    COUNT(*) as count
FROM lats_sales 
WHERE status NOT IN ('pending', 'completed', 'cancelled', 'refunded')
GROUP BY status;

-- Step 6: Add the constraint (only if no invalid values remain)
DO $$
BEGIN
    -- Check if there are any invalid status values
    IF EXISTS (
        SELECT 1 FROM lats_sales 
        WHERE status NOT IN ('pending', 'completed', 'cancelled', 'refunded')
    ) THEN
        RAISE NOTICE 'Cannot add constraint - invalid status values still exist. Please review and fix manually.';
    ELSE
        -- Add the constraint
        ALTER TABLE lats_sales ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));
        RAISE NOTICE 'Successfully added chk_status constraint to lats_sales table.';
    END IF;
END $$;

-- Step 7: Verify the constraint was added
SELECT 
    'Table constraints after fix:' as info,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'lats_sales' AND tc.constraint_name = 'chk_status'
ORDER BY tc.constraint_type, tc.constraint_name;