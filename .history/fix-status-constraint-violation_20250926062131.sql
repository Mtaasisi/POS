-- Fix Status Constraint Violation
-- This script fixes existing data before adding constraints

-- 1. Check what status values currently exist
SELECT 
    'Current status values in lats_sales:' as info,
    status,
    COUNT(*) as count
FROM lats_sales 
GROUP BY status
ORDER BY status;

-- 2. Update any invalid status values to 'completed'
UPDATE lats_sales 
SET status = 'completed' 
WHERE status NOT IN ('pending', 'completed', 'cancelled', 'refunded')
   OR status IS NULL;

-- 3. Show updated status values
SELECT 
    'Updated status values in lats_sales:' as info,
    status,
    COUNT(*) as count
FROM lats_sales 
GROUP BY status
ORDER BY status;

-- 4. Now safely add the constraint
DO $$
BEGIN
    -- Add status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'lats_sales' 
        AND tc.constraint_name = 'chk_status'
    ) THEN
        ALTER TABLE lats_sales ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));
        RAISE NOTICE 'Added chk_status constraint successfully';
    ELSE
        RAISE NOTICE 'chk_status constraint already exists';
    END IF;
END $$;

-- 5. Also check and fix discount_type values
SELECT 
    'Current discount_type values in lats_sales:' as info,
    discount_type,
    COUNT(*) as count
FROM lats_sales 
GROUP BY discount_type
ORDER BY discount_type;

-- 6. Update any invalid discount_type values
UPDATE lats_sales 
SET discount_type = 'fixed' 
WHERE discount_type NOT IN ('fixed', 'percentage')
   OR discount_type IS NULL;

-- 7. Now safely add the discount_type constraint
DO $$
BEGIN
    -- Add discount_type constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'lats_sales' 
        AND tc.constraint_name = 'chk_discount_type'
    ) THEN
        ALTER TABLE lats_sales ADD CONSTRAINT chk_discount_type CHECK (discount_type IN ('fixed', 'percentage'));
        RAISE NOTICE 'Added chk_discount_type constraint successfully';
    ELSE
        RAISE NOTICE 'chk_discount_type constraint already exists';
    END IF;
END $$;

-- 8. Final status
SELECT '🎉 Status constraint violation fixed successfully!' as status;
