-- =====================================================
-- CLEAN UP DUPLICATE INDEXES
-- =====================================================
-- This script removes duplicate indexes from the quality checks table
-- Run this in your Supabase SQL Editor

-- Remove duplicate indexes (keep the more descriptive names)
DROP INDEX IF EXISTS idx_quality_checks_order_id;
DROP INDEX IF EXISTS idx_quality_checks_item_id;

-- Keep these indexes (they have better names):
-- - idx_purchase_order_quality_checks_order_id
-- - idx_purchase_order_quality_checks_item_id
-- - idx_purchase_order_quality_checks_timestamp
-- - idx_purchase_order_quality_checks_passed

-- Verify the remaining indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'purchase_order_quality_checks'
ORDER BY indexname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Duplicate indexes cleaned up successfully!';
    RAISE NOTICE '📊 Remaining indexes:';
    RAISE NOTICE '   • purchase_order_quality_checks_pkey (primary key)';
    RAISE NOTICE '   • idx_purchase_order_quality_checks_order_id';
    RAISE NOTICE '   • idx_purchase_order_quality_checks_item_id';
    RAISE NOTICE '   • idx_purchase_order_quality_checks_timestamp';
    RAISE NOTICE '   • idx_purchase_order_quality_checks_passed';
END $$;
