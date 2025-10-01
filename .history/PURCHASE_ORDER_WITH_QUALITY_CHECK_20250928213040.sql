-- =====================================================
-- PURCHASE ORDER WORKFLOW WITH QUALITY CHECK
-- =====================================================
-- This shows the complete PO workflow including quality check

-- Step 1: Show the enhanced PO status workflow with quality check
SELECT 
    'ENHANCED PURCHASE ORDER WORKFLOW:' as message,
    '1. draft -> 2. sent -> 3. received -> 4. quality_check -> 5. completed' as workflow;

-- Step 2: Add quality check status to the constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN ('draft', 'sent', 'confirmed', 'shipped', 'partial_received', 'received', 'quality_check', 'completed', 'cancelled'));

-- Step 3: Check your current PO status
SELECT 
    'Current PO Status:' as message,
    id,
    order_number,
    status,
    payment_status,
    total_paid,
    total_amount,
    created_at,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 4: Create a function to move PO to quality check
CREATE OR REPLACE FUNCTION move_po_to_quality_check(
    purchase_order_id_param UUID,
    user_id_param UUID,
    quality_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
    audit_details JSONB;
BEGIN
    -- Get current status
    SELECT status INTO current_status 
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    -- Check if PO exists
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Check if PO is in received status
    IF current_status != 'received' THEN
        RAISE EXCEPTION 'Purchase order % is in status % and cannot be moved to quality check', purchase_order_id_param, current_status;
    END IF;
    
    -- Update status to quality_check
    UPDATE lats_purchase_orders 
    SET 
        status = 'quality_check',
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry
    BEGIN
        audit_details := jsonb_build_object(
            'message', 'Moved to quality check',
            'quality_notes', COALESCE(quality_notes, 'Quality check initiated'),
            'previous_status', current_status
        );
        
        INSERT INTO lats_purchase_order_audit (
            purchase_order_id,
            action,
            user_id,
            details,
            created_at
        ) VALUES (
            purchase_order_id_param,
            'Quality Check Started',
            user_id_param,
            audit_details,
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            NULL;
        WHEN OTHERS THEN
            NULL;
    END;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to move PO to quality check: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create a function to complete quality check
CREATE OR REPLACE FUNCTION complete_quality_check(
    purchase_order_id_param UUID,
    user_id_param UUID,
    quality_result TEXT, -- 'passed', 'failed', 'partial'
    quality_notes TEXT DEFAULT NULL,
    failed_items JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
    audit_details JSONB;
BEGIN
    -- Get current status
    SELECT status INTO current_status 
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    -- Check if PO exists
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Check if PO is in quality_check status
    IF current_status != 'quality_check' THEN
        RAISE EXCEPTION 'Purchase order % is in status % and cannot complete quality check', purchase_order_id_param, current_status;
    END IF;
    
    -- Update status based on quality result
    IF quality_result = 'passed' THEN
        UPDATE lats_purchase_orders 
        SET 
            status = 'completed',
            updated_at = NOW()
        WHERE id = purchase_order_id_param;
    ELSIF quality_result = 'failed' THEN
        UPDATE lats_purchase_orders 
        SET 
            status = 'received', -- Back to received for re-processing
            updated_at = NOW()
        WHERE id = purchase_order_id_param;
    ELSIF quality_result = 'partial' THEN
        UPDATE lats_purchase_orders 
        SET 
            status = 'partial_received',
            updated_at = NOW()
        WHERE id = purchase_order_id_param;
    END IF;
    
    -- Add audit entry
    BEGIN
        audit_details := jsonb_build_object(
            'message', format('Quality check %s', quality_result),
            'quality_notes', COALESCE(quality_notes, 'Quality check completed'),
            'quality_result', quality_result,
            'failed_items', COALESCE(failed_items, '[]'::jsonb),
            'previous_status', current_status
        );
        
        INSERT INTO lats_purchase_order_audit (
            purchase_order_id,
            action,
            user_id,
            details,
            created_at
        ) VALUES (
            purchase_order_id_param,
            'Quality Check Completed',
            user_id_param,
            audit_details,
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            NULL;
        WHEN OTHERS THEN
            NULL;
    END;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete quality check: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION move_po_to_quality_check TO authenticated;
GRANT EXECUTE ON FUNCTION complete_quality_check TO authenticated;

-- Step 7: Show the complete workflow
SELECT 
    'COMPLETE PO WORKFLOW WITH QUALITY CHECK:' as message,
    '1. draft -> 2. sent -> 3. received -> 4. quality_check -> 5. completed' as workflow,
    'Quality check can result in: passed (-> completed), failed (-> received), partial (-> partial_received)' as quality_outcomes;

-- Step 8: Success message
SELECT 
    'SUCCESS: Quality check workflow implemented!' as message,
    'Added quality_check status to PO workflow' as status_fix,
    'Created functions for quality check process' as function_fix,
    'Quality check can result in passed, failed, or partial' as quality_fix;
