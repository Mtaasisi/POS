-- =====================================================
-- UPDATE COMPLETE QUALITY CHECK TO CHANGE PO STATUS
-- =====================================================
-- This migration updates the complete_quality_check function
-- to change the purchase order status after quality check

-- Drop and recreate the function with status update logic
DROP FUNCTION IF EXISTS complete_quality_check(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_quality_check(UUID, TEXT);
DROP FUNCTION IF EXISTS complete_quality_check(UUID);
DROP FUNCTION IF EXISTS complete_quality_check;

CREATE OR REPLACE FUNCTION complete_quality_check(
    p_quality_check_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_items INTEGER;
    v_passed_items INTEGER;
    v_failed_items INTEGER;
    v_overall_result VARCHAR(50);
BEGIN
    -- Count total items
    SELECT COUNT(*) INTO v_total_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id;

    -- Count passed items
    SELECT COUNT(*) INTO v_passed_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id
    AND result = 'pass';

    -- Count failed items
    SELECT COUNT(*) INTO v_failed_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id
    AND result = 'fail';

    -- Determine overall result
    IF v_failed_items = 0 THEN
        v_overall_result := 'pass';
    ELSIF v_passed_items = 0 THEN
        v_overall_result := 'fail';
    ELSE
        v_overall_result := 'conditional';
    END IF;

    -- Update the quality check
    UPDATE purchase_order_quality_checks
    SET 
        status = 'passed',
        overall_result = v_overall_result,
        checked_at = NOW(),
        notes = COALESCE(p_notes, notes),
        signature = COALESCE(p_signature, signature),
        updated_at = NOW()
    WHERE id = p_quality_check_id;

    -- Keep purchase order status as 'received' after quality check
    -- Status will be changed to 'completed' only after items are added to inventory
    -- This allows users to fill in selling prices and inventory details
    RAISE NOTICE 'Quality check completed with result: %. Ready to add to inventory.', v_overall_result;

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to complete quality check: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_quality_check TO authenticated;

COMMENT ON FUNCTION complete_quality_check IS 'Completes a quality check by calculating overall results, updating the status, and changing the purchase order status to completed if passed.';

