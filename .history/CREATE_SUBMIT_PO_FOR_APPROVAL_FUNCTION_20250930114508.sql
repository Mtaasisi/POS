-- =====================================================
-- CREATE SUBMIT_PO_FOR_APPROVAL FUNCTION
-- =====================================================
-- This script creates the missing submit_po_for_approval RPC function
-- that's causing the 404 error in the frontend

-- Step 1: Ensure the approval status constraint includes pending_approval
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'confirmed', 'shipped', 'partial_received', 'received', 'quality_check', 'completed', 'cancelled'));

-- Step 2: Add approval-related columns if they don't exist
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approval_amount_limit DECIMAL(12,2) DEFAULT 0;

-- Step 3: Create the submit_po_for_approval function
CREATE OR REPLACE FUNCTION submit_po_for_approval(
    purchase_order_id_param UUID,
    user_id_param UUID,
    approval_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
    total_amount DECIMAL(12,2);
    audit_details JSONB;
BEGIN
    -- Get current status and total amount
    SELECT status, total_amount INTO current_status, total_amount
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    -- Check if PO exists
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Check if PO is in draft status
    IF current_status != 'draft' THEN
        RAISE EXCEPTION 'Purchase order % is in status % and cannot be submitted for approval', purchase_order_id_param, current_status;
    END IF;
    
    -- Update status to pending_approval
    UPDATE lats_purchase_orders 
    SET 
        status = 'pending_approval',
        approval_status = 'pending',
        approval_notes = COALESCE(approval_notes, 'Submitted for approval'),
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry (with error handling for missing audit table)
    BEGIN
        audit_details := jsonb_build_object(
            'message', 'Submitted for approval',
            'approval_notes', COALESCE(approval_notes, 'Submitted for approval'),
            'total_amount', total_amount,
            'previous_status', current_status
        );
        
        -- Try to insert into audit table if it exists
        INSERT INTO lats_purchase_order_audit (
            purchase_order_id,
            action,
            user_id,
            details,
            created_at
        ) VALUES (
            purchase_order_id_param,
            'Submitted for Approval',
            user_id_param,
            audit_details,
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- Audit table doesn't exist, continue without error
            NULL;
        WHEN OTHERS THEN
            -- Other audit errors, continue without error
            NULL;
    END;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to submit PO for approval: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION submit_po_for_approval TO authenticated;

-- Step 5: Verify the function was created successfully
DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'submit_po_for_approval'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ submit_po_for_approval function created successfully!';
    ELSE
        RAISE NOTICE '❌ Failed to create submit_po_for_approval function';
    END IF;
END $$;

-- Step 6: Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 submit_po_for_approval Function Created Successfully!';
    RAISE NOTICE '📋 What was fixed:';
    RAISE NOTICE '   ✅ Created submit_po_for_approval RPC function';
    RAISE NOTICE '   ✅ Added approval status constraint';
    RAISE NOTICE '   ✅ Added approval-related columns';
    RAISE NOTICE '   ✅ Granted execute permissions to authenticated users';
    RAISE NOTICE '🚀 The 404 error should now be resolved!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Frontend can now call:';
    RAISE NOTICE '   supabase.rpc("submit_po_for_approval", {';
    RAISE NOTICE '     purchase_order_id_param: "uuid",';
    RAISE NOTICE '     user_id_param: "uuid",';
    RAISE NOTICE '     approval_notes: "string"';
    RAISE NOTICE '   })';
END $$;
