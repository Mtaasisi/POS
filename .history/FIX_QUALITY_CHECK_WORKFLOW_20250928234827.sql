-- =====================================================
-- FIX QUALITY CHECK WORKFLOW FOR EXISTING TABLE
-- =====================================================
-- This script works with the existing purchase_order_quality_checks table
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- 1. UPDATE PURCHASE ORDER STATUS CONSTRAINT
-- =====================================================
-- Add quality_check status to the allowed statuses (only if not already exists)

-- First, check if constraint exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_purchase_orders_status_check'
        AND table_name = 'lats_purchase_orders'
    ) THEN
        ALTER TABLE lats_purchase_orders DROP CONSTRAINT lats_purchase_orders_status_check;
    END IF;
END $$;

-- Add the updated constraint
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN (
    'draft', 
    'sent', 
    'confirmed', 
    'shipped', 
    'partial_received', 
    'received', 
    'quality_check',    -- NEW: Quality check status
    'completed', 
    'cancelled'
));

-- =====================================================
-- 2. ENSURE QUALITY CHECKS TABLE HAS CORRECT STRUCTURE
-- =====================================================
-- Check if the table has the right columns, add missing ones if needed

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add checked_at column if it doesn't exist (for compatibility)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_order_quality_checks' 
        AND column_name = 'checked_at'
    ) THEN
        ALTER TABLE purchase_order_quality_checks 
        ADD COLUMN checked_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_order_quality_checks' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE purchase_order_quality_checks 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 3. CREATE INDEXES (if they don't exist)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_quality_checks_order_id ON purchase_order_quality_checks(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_item_id ON purchase_order_quality_checks(item_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_timestamp ON purchase_order_quality_checks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_quality_checks_passed ON purchase_order_quality_checks(passed);

-- =====================================================
-- 4. FUNCTION: MOVE PO TO QUALITY CHECK
-- =====================================================
CREATE OR REPLACE FUNCTION move_po_to_quality_check(
    purchase_order_id_param UUID,
    user_id_param UUID DEFAULT NULL,
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
        RAISE EXCEPTION 'Purchase order % is in status % and cannot be moved to quality check. Only orders in "received" status can be quality checked.', purchase_order_id_param, current_status;
    END IF;
    
    -- Update status to quality_check
    UPDATE lats_purchase_orders 
    SET 
        status = 'quality_check',
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Prepare audit details
    audit_details := jsonb_build_object(
        'action', 'moved_to_quality_check',
        'previous_status', current_status,
        'new_status', 'quality_check',
        'quality_notes', quality_notes,
        'user_id', user_id_param
    );
    
    -- Add audit entry
    BEGIN
        INSERT INTO purchase_order_audit (
            purchase_order_id,
            action,
            "user",
            details,
            timestamp
        ) VALUES (
            purchase_order_id_param,
            'Quality Check Started',
            COALESCE(user_id_param::TEXT, 'system'),
            audit_details::TEXT,
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- Continue if audit fails
        NULL;
    END;
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error and return false
    RAISE WARNING 'Error moving PO % to quality check: %', purchase_order_id_param, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNCTION: COMPLETE QUALITY CHECK
-- =====================================================
CREATE OR REPLACE FUNCTION complete_quality_check(
    purchase_order_id_param UUID,
    quality_result TEXT, -- 'passed', 'failed', 'partial'
    quality_notes TEXT DEFAULT NULL,
    user_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
    audit_details JSONB;
    new_status TEXT;
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
        RAISE EXCEPTION 'Purchase order % is in status % and cannot complete quality check. Only orders in "quality_check" status can complete quality check.', purchase_order_id_param, current_status;
    END IF;
    
    -- Determine new status based on quality result
    CASE quality_result
        WHEN 'passed' THEN
            new_status := 'completed';
        WHEN 'failed' THEN
            new_status := 'received'; -- Back to received for re-processing
        WHEN 'partial' THEN
            new_status := 'partial_received';
        ELSE
            RAISE EXCEPTION 'Invalid quality result: %. Must be "passed", "failed", or "partial"', quality_result;
    END CASE;
    
    -- Update status
    UPDATE lats_purchase_orders 
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Prepare audit details
    audit_details := jsonb_build_object(
        'action', 'quality_check_completed',
        'quality_result', quality_result,
        'previous_status', current_status,
        'new_status', new_status,
        'quality_notes', quality_notes,
        'user_id', user_id_param
    );
    
    -- Add audit entry
    BEGIN
        INSERT INTO purchase_order_audit (
            purchase_order_id,
            action,
            "user",
            details,
            timestamp
        ) VALUES (
            purchase_order_id_param,
            'Quality Check Completed: ' || quality_result,
            COALESCE(user_id_param::TEXT, 'system'),
            audit_details::TEXT,
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- Continue if audit fails
        NULL;
    END;
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error and return false
    RAISE WARNING 'Error completing quality check for PO %: %', purchase_order_id_param, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCTION: ADD ITEM QUALITY CHECK
-- =====================================================
CREATE OR REPLACE FUNCTION add_item_quality_check(
    purchase_order_id_param UUID,
    item_id_param UUID,
    passed BOOLEAN,
    notes TEXT DEFAULT NULL,
    checked_by_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    po_exists BOOLEAN;
    item_exists BOOLEAN;
BEGIN
    -- Check if purchase order exists
    SELECT EXISTS(
        SELECT 1 FROM lats_purchase_orders 
        WHERE id = purchase_order_id_param
    ) INTO po_exists;
    
    IF NOT po_exists THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Check if item exists and belongs to the purchase order
    SELECT EXISTS(
        SELECT 1 FROM lats_purchase_order_items 
        WHERE id = item_id_param 
        AND purchase_order_id = purchase_order_id_param
    ) INTO item_exists;
    
    IF NOT item_exists THEN
        RAISE EXCEPTION 'Purchase order item % not found for purchase order %', item_id_param, purchase_order_id_param;
    END IF;
    
    -- Insert quality check record (use timestamp field)
    INSERT INTO purchase_order_quality_checks (
        purchase_order_id,
        item_id,
        passed,
        notes,
        checked_by,
        timestamp
    ) VALUES (
        purchase_order_id_param,
        item_id_param,
        passed,
        notes,
        COALESCE(checked_by_param, 'system'),
        NOW()
    );
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error and return false
    RAISE WARNING 'Error adding quality check for item %: %', item_id_param, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCTION: GET QUALITY CHECK SUMMARY
-- =====================================================
CREATE OR REPLACE FUNCTION get_quality_check_summary(
    purchase_order_id_param UUID
) RETURNS TABLE (
    total_items BIGINT,
    checked_items BIGINT,
    passed_items BIGINT,
    failed_items BIGINT,
    pending_items BIGINT,
    overall_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(poi.id) as total_items,
        COUNT(qc.id) as checked_items,
        COUNT(CASE WHEN qc.passed = true THEN 1 END) as passed_items,
        COUNT(CASE WHEN qc.passed = false THEN 1 END) as failed_items,
        COUNT(poi.id) - COUNT(qc.id) as pending_items,
        CASE 
            WHEN COUNT(qc.id) = 0 THEN 'not_started'
            WHEN COUNT(qc.id) = COUNT(poi.id) AND COUNT(CASE WHEN qc.passed = false THEN 1 END) = 0 THEN 'passed'
            WHEN COUNT(CASE WHEN qc.passed = false THEN 1 END) > 0 THEN 'failed'
            ELSE 'partial'
        END as overall_status
    FROM lats_purchase_order_items poi
    LEFT JOIN purchase_order_quality_checks qc ON poi.id = qc.item_id
    WHERE poi.purchase_order_id = purchase_order_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. VIEW: QUALITY CHECK DETAILS
-- =====================================================
CREATE OR REPLACE VIEW purchase_order_quality_details AS
SELECT 
    po.id as purchase_order_id,
    po.order_number,
    po.status as po_status,
    poi.id as item_id,
    poi.product_name,
    poi.quantity,
    poi.received_quantity,
    qc.id as quality_check_id,
    qc.passed,
    qc.notes as quality_notes,
    qc.checked_by,
    qc.timestamp as checked_at,
    CASE 
        WHEN qc.id IS NULL THEN 'pending'
        WHEN qc.passed = true THEN 'passed'
        WHEN qc.passed = false THEN 'failed'
    END as quality_status
FROM lats_purchase_orders po
JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
LEFT JOIN purchase_order_quality_checks qc ON poi.id = qc.item_id
WHERE po.status IN ('quality_check', 'completed');

-- Commit transaction
COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Quality Check Workflow Fixed for Existing Table!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Available Functions:';
    RAISE NOTICE '   • move_po_to_quality_check() - Move PO to quality check status';
    RAISE NOTICE '   • complete_quality_check() - Complete quality check with result';
    RAISE NOTICE '   • add_item_quality_check() - Add quality check for individual item';
    RAISE NOTICE '   • get_quality_check_summary() - Get quality check summary';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Available Views:';
    RAISE NOTICE '   • purchase_order_quality_details - Detailed quality check view';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 New Workflow:';
    RAISE NOTICE '   received → quality_check → completed/failed/partial_received';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Quality check system is now ready to use!';
END $$;
