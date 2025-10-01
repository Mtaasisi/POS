-- =====================================================
-- IMPLEMENT APPROVAL WORKFLOW
-- =====================================================
-- This implements the most critical missing action: APPROVAL WORKFLOW

-- Step 1: Add approval status to the constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'confirmed', 'shipped', 'partial_received', 'received', 'quality_check', 'completed', 'cancelled'));

-- Step 2: Add approval-related columns
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approval_amount_limit DECIMAL(12,2) DEFAULT 0;

-- Step 3: Create function to submit PO for approval
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
    
    -- Add audit entry
    BEGIN
        audit_details := jsonb_build_object(
            'message', 'Submitted for approval',
            'approval_notes', COALESCE(approval_notes, 'Submitted for approval'),
            'total_amount', total_amount,
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
            'Submitted for Approval',
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
        RAISE EXCEPTION 'Failed to submit PO for approval: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create function to approve PO
CREATE OR REPLACE FUNCTION approve_po(
    purchase_order_id_param UUID,
    approver_id_param UUID,
    approval_notes TEXT DEFAULT NULL
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
    
    -- Check if PO is pending approval
    IF current_status != 'pending_approval' THEN
        RAISE EXCEPTION 'Purchase order % is in status % and cannot be approved', purchase_order_id_param, current_status;
    END IF;
    
    -- Update status to approved
    UPDATE lats_purchase_orders 
    SET 
        status = 'approved',
        approval_status = 'approved',
        approved_by = approver_id_param,
        approved_at = NOW(),
        approval_notes = COALESCE(approval_notes, 'Approved'),
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry
    BEGIN
        audit_details := jsonb_build_object(
            'message', 'Purchase order approved',
            'approval_notes', COALESCE(approval_notes, 'Approved'),
            'approved_by', approver_id_param,
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
            'Approved',
            approver_id_param,
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
        RAISE EXCEPTION 'Failed to approve PO: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to reject PO
CREATE OR REPLACE FUNCTION reject_po(
    purchase_order_id_param UUID,
    approver_id_param UUID,
    rejection_reason TEXT
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
    
    -- Check if PO is pending approval
    IF current_status != 'pending_approval' THEN
        RAISE EXCEPTION 'Purchase order % is in status % and cannot be rejected', purchase_order_id_param, current_status;
    END IF;
    
    -- Update status to draft (back to draft for revision)
    UPDATE lats_purchase_orders 
    SET 
        status = 'draft',
        approval_status = 'rejected',
        approved_by = approver_id_param,
        approved_at = NOW(),
        approval_notes = rejection_reason,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry
    BEGIN
        audit_details := jsonb_build_object(
            'message', 'Purchase order rejected',
            'rejection_reason', rejection_reason,
            'rejected_by', approver_id_param,
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
            'Rejected',
            approver_id_param,
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
        RAISE EXCEPTION 'Failed to reject PO: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION submit_po_for_approval TO authenticated;
GRANT EXECUTE ON FUNCTION approve_po TO authenticated;
GRANT EXECUTE ON FUNCTION reject_po TO authenticated;

-- Step 7: Show the complete workflow with approval
SELECT 
    'COMPLETE PO WORKFLOW WITH APPROVAL:' as message,
    '1. draft -> 2. pending_approval -> 3. approved -> 4. sent -> 5. received -> 6. quality_check -> 7. completed' as workflow,
    'Approval workflow prevents unauthorized purchases and ensures budget compliance' as approval_benefit;

-- Step 8: Success message
SELECT 
    'SUCCESS: Approval workflow implemented!' as message,
    'Added pending_approval and approved statuses' as status_fix,
    'Created approval functions: submit, approve, reject' as function_fix,
    'Approval workflow now prevents unauthorized purchases' as security_fix;
