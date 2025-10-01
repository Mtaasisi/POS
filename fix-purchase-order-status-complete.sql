-- =====================================================
-- FIX PURCHASE ORDER STATUS CONSTRAINT - COMPLETE FIX
-- =====================================================
-- This fixes the mismatch between database constraints and application code
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS check_status;

-- Step 2: Add the complete constraint with ALL statuses used in the application
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN (
    'draft',              -- Initial state, being edited
    'pending_approval',   -- Submitted for manager approval
    'approved',          -- Approved by manager
    'sent',              -- Sent to supplier
    'confirmed',         -- Confirmed by supplier
    'shipped',           -- Shipped by supplier
    'partial_received',  -- Partially received
    'received',          -- Fully received
    'quality_checked',   -- Quality check completed
    'completed',         -- Completed and in inventory
    'cancelled'          -- Cancelled
));

-- Step 3: Verify the constraint was added correctly
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'lats_purchase_orders_status_check';

-- Step 4: Check current status distribution
SELECT status, COUNT(*) as count
FROM lats_purchase_orders
GROUP BY status
ORDER BY count DESC;

-- Step 5: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lats_purchase_orders_status 
ON lats_purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_lats_purchase_orders_payment_status 
ON lats_purchase_orders(payment_status);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Purchase order status constraint updated successfully!';
    RAISE NOTICE '📊 Allowed statuses: draft, pending_approval, approved, sent, confirmed, shipped, partial_received, received, quality_checked, completed, cancelled';
END $$;

