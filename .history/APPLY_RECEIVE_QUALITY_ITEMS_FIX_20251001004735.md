# Fix: Receive Quality-Checked Items to Inventory

## Issue
Quality check shows items but "Received" tab is empty - items need to be received to inventory.

## Solution
Run the SQL below in your Supabase SQL Editor to create the function.

## Steps:

1. **Open Supabase Dashboard**
   - Go to: https://jxhzveborezjhsmzsgbc.supabase.co
   - Navigate to: SQL Editor

2. **Copy and Run This SQL:**

```sql
-- =====================================================
-- CREATE FUNCTION TO RECEIVE QUALITY-CHECKED ITEMS TO INVENTORY
-- =====================================================

DROP FUNCTION IF EXISTS receive_quality_checked_items(UUID, UUID);
DROP FUNCTION IF EXISTS receive_quality_checked_items(TEXT, TEXT);

CREATE OR REPLACE FUNCTION receive_quality_checked_items(
    p_quality_check_id UUID,
    p_purchase_order_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_quality_check RECORD;
    v_items_count INTEGER := 0;
    v_received_count INTEGER := 0;
    v_po_item RECORD;
    v_qc_item RECORD;
    v_inventory_item_id UUID;
BEGIN
    -- Validate inputs
    IF p_quality_check_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Quality check ID is required'
        );
    END IF;
    
    IF p_purchase_order_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Purchase order ID is required'
        );
    END IF;
    
    -- Get quality check details
    SELECT * INTO v_quality_check
    FROM purchase_order_quality_checks
    WHERE id = p_quality_check_id
    AND purchase_order_id = p_purchase_order_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Quality check not found for this purchase order'
        );
    END IF;
    
    -- Process each quality check item that passed
    FOR v_qc_item IN (
        SELECT 
            qci.*,
            poi.product_id,
            poi.variant_id,
            poi.unit_price as cost_price,
            poi.quantity as ordered_quantity
        FROM purchase_order_quality_check_items qci
        JOIN lats_purchase_order_items poi ON qci.purchase_order_item_id = poi.id
        WHERE qci.quality_check_id = p_quality_check_id
        AND qci.result = 'pass'
        AND qci.quantity_passed > 0
    ) LOOP
        v_items_count := v_items_count + 1;
        
        -- Check if product uses serial numbers
        DECLARE
            v_uses_serial BOOLEAN := false;
        BEGIN
            SELECT COALESCE(uses_serial_number, false) INTO v_uses_serial
            FROM lats_products
            WHERE id = v_qc_item.product_id;
            
            IF v_uses_serial THEN
                -- For serialized items, create inventory adjustment
                INSERT INTO lats_inventory_adjustments (
                    id,
                    product_id,
                    variant_id,
                    adjustment_type,
                    quantity,
                    cost_price,
                    reason,
                    purchase_order_id,
                    notes,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    v_qc_item.product_id,
                    v_qc_item.variant_id,
                    'receive',
                    v_qc_item.quantity_passed,
                    v_qc_item.cost_price,
                    'Quality check passed - received to inventory',
                    p_purchase_order_id,
                    'Quality Check ID: ' || p_quality_check_id || ' - ' || COALESCE(v_qc_item.notes, ''),
                    NOW(),
                    NOW()
                );
                
                v_received_count := v_received_count + v_qc_item.quantity_passed;
            ELSE
                -- For non-serialized items, create inventory adjustment
                INSERT INTO lats_inventory_adjustments (
                    id,
                    product_id,
                    variant_id,
                    adjustment_type,
                    quantity,
                    cost_price,
                    reason,
                    purchase_order_id,
                    notes,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    v_qc_item.product_id,
                    v_qc_item.variant_id,
                    'receive',
                    v_qc_item.quantity_passed,
                    v_qc_item.cost_price,
                    'Quality check passed - received to inventory',
                    p_purchase_order_id,
                    'Quality Check ID: ' || p_quality_check_id || ' - ' || COALESCE(v_qc_item.notes, ''),
                    NOW(),
                    NOW()
                );
                
                v_received_count := v_received_count + v_qc_item.quantity_passed;
            END IF;
        END;
    END LOOP;
    
    -- Update purchase order items with received quantities
    FOR v_qc_item IN (
        SELECT 
            qci.purchase_order_item_id,
            qci.quantity_passed
        FROM purchase_order_quality_check_items qci
        WHERE qci.quality_check_id = p_quality_check_id
        AND qci.result = 'pass'
        AND qci.quantity_passed > 0
    ) LOOP
        UPDATE lats_purchase_order_items
        SET 
            received_quantity = COALESCE(received_quantity, 0) + v_qc_item.quantity_passed,
            updated_at = NOW()
        WHERE id = v_qc_item.purchase_order_item_id;
    END LOOP;
    
    -- Check if all items are now fully received
    DECLARE
        v_all_received BOOLEAN := true;
    BEGIN
        SELECT 
            BOOL_AND(COALESCE(received_quantity, 0) >= quantity)
        INTO v_all_received
        FROM lats_purchase_order_items
        WHERE purchase_order_id = p_purchase_order_id;
        
        -- Update purchase order status if all items received
        IF v_all_received THEN
            UPDATE lats_purchase_orders
            SET 
                status = 'received',
                updated_at = NOW()
            WHERE id = p_purchase_order_id
            AND status NOT IN ('completed', 'cancelled');
        ELSE
            UPDATE lats_purchase_orders
            SET 
                status = 'partial',
                updated_at = NOW()
            WHERE id = p_purchase_order_id
            AND status NOT IN ('completed', 'cancelled', 'received');
        END IF;
    END;
    
    RETURN json_build_object(
        'success', true,
        'message', v_received_count || ' items received to inventory successfully',
        'items_processed', v_items_count,
        'items_received', v_received_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error receiving items: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION receive_quality_checked_items(UUID, UUID) TO authenticated;

-- Create string version for frontend compatibility
CREATE OR REPLACE FUNCTION receive_quality_checked_items(
    p_quality_check_id TEXT,
    p_purchase_order_id TEXT
)
RETURNS JSON AS $$
DECLARE
    v_qc_uuid UUID;
    v_po_uuid UUID;
BEGIN
    -- Convert strings to UUIDs
    BEGIN
        v_qc_uuid := p_quality_check_id::UUID;
        v_po_uuid := p_purchase_order_id::UUID;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Invalid UUID format'
            );
    END;
    
    -- Call the main function
    RETURN receive_quality_checked_items(v_qc_uuid, v_po_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION receive_quality_checked_items(TEXT, TEXT) TO authenticated;
```

3. **Click "Run"** (or press Ctrl+Enter)

4. **Verify Success** - You should see:
   - "Success. No rows returned"
   - Or a success message

5. **Test the Fix:**
   - Go back to your Purchase Order page
   - Refresh the page
   - Go to "Received" tab
   - Click the green "Receive to Inventory" button
   - Items will now appear in the received items list!

## What This Does:
✅ Creates function to receive quality-checked items to inventory  
✅ Adds inventory adjustment records for passed items  
✅ Updates purchase order status automatically  
✅ Shows received items in the "Received" tab  
