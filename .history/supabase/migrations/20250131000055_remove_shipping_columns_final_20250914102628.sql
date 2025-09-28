-- Remove shipping columns from lats_purchase_orders table
-- This fixes the 400 Bad Request error when creating purchase orders
-- by removing columns that the frontend is trying to send but shouldn't

-- =====================================================
-- REMOVE SHIPPING COLUMNS FROM PURCHASE ORDERS
-- =====================================================

-- Remove shipping columns that are causing 400 errors
ALTER TABLE lats_purchase_orders 
DROP COLUMN IF EXISTS tracking_number,
DROP COLUMN IF EXISTS shipping_status,
DROP COLUMN IF EXISTS estimated_delivery_date,
DROP COLUMN IF EXISTS shipping_notes,
DROP COLUMN IF EXISTS shipping_info,
DROP COLUMN IF EXISTS shipped_date,
DROP COLUMN IF EXISTS delivered_date,
DROP COLUMN IF EXISTS shipping_date;

-- =====================================================
-- DROP RELATED CONSTRAINTS
-- =====================================================

-- Drop shipping status constraint if it exists
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS check_shipping_status;

-- =====================================================
-- DROP RELATED INDEXES
-- =====================================================

-- Drop shipping-related indexes
DROP INDEX IF EXISTS idx_purchase_orders_tracking_number;
DROP INDEX IF EXISTS idx_purchase_orders_shipping_status;
DROP INDEX IF EXISTS idx_purchase_orders_estimated_delivery_date;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Shipping columns removed from lats_purchase_orders table successfully';
    RAISE NOTICE 'Removed columns:';
    RAISE NOTICE '   - tracking_number';
    RAISE NOTICE '   - shipping_status';
    RAISE NOTICE '   - estimated_delivery_date';
    RAISE NOTICE '   - shipping_notes';
    RAISE NOTICE '   - shipping_info';
    RAISE NOTICE '   - shipped_date';
    RAISE NOTICE '   - delivered_date';
    RAISE NOTICE '   - shipping_date';
    RAISE NOTICE 'Purchase order creation should now work without 400 errors';
END $$;
