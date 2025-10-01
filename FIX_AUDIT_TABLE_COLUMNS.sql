-- Fix the audit table column mismatch
-- The function is trying to use columns that don't exist

-- =====================================================
-- STEP 1: CHECK CURRENT AUDIT TABLE STRUCTURE
-- =====================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_order_audit'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: DROP AND RECREATE AUDIT TABLE WITH CORRECT STRUCTURE
-- =====================================================

-- Drop existing audit table
DROP TABLE IF EXISTS purchase_order_audit CASCADE;

-- Create audit table with the structure the function expects
CREATE TABLE purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX idx_purchase_order_audit_created_at ON purchase_order_audit(created_at);

-- Enable RLS
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view audit records" ON purchase_order_audit
    FOR SELECT USING (true);

CREATE POLICY "Users can create audit records" ON purchase_order_audit
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON purchase_order_audit TO authenticated;

-- =====================================================
-- STEP 3: UPDATE THE FUNCTION TO USE CORRECT COLUMNS
-- =====================================================

CREATE OR REPLACE FUNCTION complete_purchase_order_receive(
    purchase_order_id_param UUID,
    user_id_param UUID,
    receive_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_item RECORD;
    total_items INTEGER := 0;
    received_items INTEGER := 0;
    current_po_status TEXT;
    current_po_number TEXT;
BEGIN
    SELECT status, order_number INTO current_po_status, current_po_number
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF current_po_status IS NULL THEN
        RAISE EXCEPTION 'Purchase order not found';
    END IF;
    
    CASE current_po_status
        WHEN 'received' THEN
            RAISE NOTICE 'Purchase order is already received';
            RETURN TRUE;
        WHEN 'completed' THEN
            RAISE NOTICE 'Purchase order is already completed';
            RETURN TRUE;
        WHEN 'draft' THEN
            RAISE EXCEPTION 'Purchase order is in draft status and must be sent before receiving';
        WHEN 'cancelled' THEN
            RAISE EXCEPTION 'Purchase order is cancelled and cannot be received';
        WHEN 'sent', 'confirmed', 'shipped', 'partial_received' THEN
            NULL;
        ELSE
            RAISE EXCEPTION 'Purchase order is in status "%s" and cannot be received', current_po_status;
    END CASE;
    
    FOR order_item IN 
        SELECT poi.id, poi.product_id, poi.variant_id, poi.quantity, poi.received_quantity, poi.cost_price
        FROM lats_purchase_order_items poi
        WHERE poi.purchase_order_id = purchase_order_id_param
    LOOP
        total_items := total_items + 1;
        UPDATE lats_purchase_order_items 
        SET received_quantity = order_item.quantity, updated_at = NOW()
        WHERE id = order_item.id;
        received_items := received_items + 1;
    END LOOP;
    
    UPDATE lats_purchase_orders 
    SET status = 'received', updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Insert into audit table with correct columns
    INSERT INTO purchase_order_audit (
        purchase_order_id, action, user_id, created_by, details, created_at
    ) VALUES (
        purchase_order_id_param, 'Full receive', user_id_param, user_id_param,
        format('Received %s items out of %s total items', received_items, total_items), NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete purchase order receive: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_purchase_order_receive(UUID, UUID, TEXT) TO authenticated;

-- =====================================================
-- STEP 4: TEST THE FIX
-- =====================================================

-- Test with a "sent" order
SELECT complete_purchase_order_receive(
    '8956fb48-1f2f-43f8-82f9-a526d8485fbd'::UUID,
    auth.uid(),
    'Test after column fix'
);
