-- =====================================================
-- FIX PURCHASE ORDER STATUS CHECK CONSTRAINT
-- =====================================================
-- This migration updates the status constraint to include all workflow statuses

-- Drop the old constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

-- Add the new constraint with all statuses
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN (
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'confirmed',
  'shipped',
  'partial_received',
  'received',
  'completed',
  'cancelled'
));

-- Verify the constraint
DO $$
BEGIN
    RAISE NOTICE 'Purchase order status constraint updated successfully';
    RAISE NOTICE 'Allowed statuses: draft, pending_approval, approved, sent, confirmed, shipped, partial_received, received, completed, cancelled';
END $$;

