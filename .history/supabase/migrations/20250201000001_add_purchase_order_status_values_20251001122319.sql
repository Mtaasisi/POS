-- Add additional status values to lats_purchase_orders table
-- This fixes the 400 Bad Request error when updating order status

-- =====================================================
-- UPDATE STATUS CHECK CONSTRAINT
-- =====================================================

-- Drop the existing status check constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

-- Add the new status check constraint with additional values
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN (
    'draft',           -- Initial draft state
    'sent',            -- Sent to supplier
    'confirmed',       -- Confirmed by supplier
    'shipped',         -- Items have been shipped
    'partial_received', -- Some items received
    'received',        -- All items received
    'cancelled'        -- Order cancelled
));

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_purchase_orders.status IS 'Order status: draft, sent, confirmed, shipped, partial_received, received, or cancelled';

-- =====================================================
-- CREATE INDEX FOR BETTER PERFORMANCE
-- =====================================================

-- Add index on status column for faster queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON lats_purchase_orders(status);

