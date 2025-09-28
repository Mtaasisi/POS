-- Add 'accepted' status to repair_parts table constraint
-- Migration: 20250131000060_add_accepted_status_to_repair_parts.sql

-- Drop the existing status constraint
ALTER TABLE repair_parts DROP CONSTRAINT IF EXISTS repair_parts_status_check;

-- Add the updated constraint with 'accepted' status
ALTER TABLE repair_parts ADD CONSTRAINT repair_parts_status_check 
CHECK (status IN ('needed', 'ordered', 'accepted', 'received', 'used'));

-- Add comment for documentation
COMMENT ON COLUMN repair_parts.status IS 'Repair part status: needed, ordered, accepted, received, used';

-- Verification
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'repair_parts'
        AND constraint_name = 'repair_parts_status_check'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE '✅ Repair parts status constraint updated successfully!';
        RAISE NOTICE '✅ accepted status is now allowed!';
    ELSE
        RAISE NOTICE '❌ Failed to update repair parts status constraint';
    END IF;
END $$;
