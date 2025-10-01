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

COMMENT ON FUNCTION complete_quality_check IS 'Completes a quality check by calculating overall results and updating the status. Items must still be added to inventory with selling prices.';

-- =====================================================
-- CREATE ADD TO INVENTORY FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS add_quality_checked_items_to_inventory;

-- Create function to add quality-checked items to inventory
CREATE OR REPLACE FUNCTION add_quality_checked_items_to_inventory(
    p_quality_check_id UUID,
    p_purchase_order_id UUID,
    p_user_id UUID,
    p_default_selling_price DECIMAL DEFAULT NULL,
    p_default_location VARCHAR DEFAULT NULL,
    p_profit_margin_percentage DECIMAL DEFAULT 30.0 -- Default 30% markup
)
RETURNS JSONB AS $$
DECLARE
    v_po_item_record RECORD;
    v_check_item_record RECORD;
    v_total_passed INTEGER := 0;
    v_items_added INTEGER := 0;
    v_selling_price DECIMAL;
    v_cost_price DECIMAL;
    v_overall_result VARCHAR(50);
BEGIN
    -- Check quality check result
    SELECT overall_result INTO v_overall_result
    FROM purchase_order_quality_checks
    WHERE id = p_quality_check_id;

    -- Only add items if quality check passed
    IF v_overall_result != 'pass' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Cannot add items to inventory. Quality check did not pass.',
            'items_added', 0
        );
    END IF;

    -- For each purchase order item that passed quality check
    FOR v_po_item_record IN 
        SELECT DISTINCT 
            poi.id, 
            poi.product_id, 
            poi.variant_id, 
            poi.quantity, 
            poi.cost_price as unit_cost
        FROM lats_purchase_order_items poi
        WHERE poi.purchase_order_id = p_purchase_order_id
    LOOP
        -- Get total passed quantity for this item
        SELECT COALESCE(SUM(quantity_passed), 0) INTO v_total_passed
        FROM purchase_order_quality_check_items
        WHERE quality_check_id = p_quality_check_id
        AND purchase_order_item_id = v_po_item_record.id
        AND result = 'pass';

        IF v_total_passed > 0 THEN
            -- Calculate selling price
            v_cost_price := v_po_item_record.unit_cost;
            IF p_default_selling_price IS NOT NULL THEN
                v_selling_price := p_default_selling_price;
            ELSE
                -- Apply profit margin
                v_selling_price := v_cost_price * (1 + p_profit_margin_percentage / 100.0);
            END IF;

            -- Update received quantity
            UPDATE lats_purchase_order_items
            SET 
                received_quantity = COALESCE(received_quantity, 0) + v_total_passed,
                updated_at = NOW()
            WHERE id = v_po_item_record.id;

            -- Create inventory adjustment (for non-serialized items)
            INSERT INTO lats_inventory_adjustments (
                purchase_order_id,
                product_id,
                variant_id,
                adjustment_type,
                quantity,
                cost_price,
                reason,
                reference_id,
                processed_by,
                created_at
            ) VALUES (
                p_purchase_order_id,
                v_po_item_record.product_id,
                v_po_item_record.variant_id,
                'receive',
                v_total_passed,
                v_cost_price,
                'Received from quality-checked purchase order',
                v_po_item_record.id,
                p_user_id,
                NOW()
            );

            -- Update product variant with selling price and stock
            UPDATE lats_product_variants
            SET 
                quantity = COALESCE(quantity, 0) + v_total_passed,
                price = v_selling_price, -- Update selling price
                cost_price = v_cost_price,
                updated_at = NOW()
            WHERE id = v_po_item_record.variant_id;

            v_items_added := v_items_added + 1;
        END IF;
    END LOOP;

    -- Update purchase order status to completed
    UPDATE lats_purchase_orders
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE id = p_purchase_order_id;

    -- Log audit
    INSERT INTO purchase_order_audit (
        purchase_order_id,
        action,
        user_id,
        created_by,
        details,
        timestamp
    ) VALUES (
        p_purchase_order_id,
        'Added to inventory',
        p_user_id,
        p_user_id,
        jsonb_build_object(
            'message', format('Added %s quality-checked items to inventory', v_items_added),
            'items_added', v_items_added,
            'profit_margin', p_profit_margin_percentage,
            'location', p_default_location
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully added %s items to inventory', v_items_added),
        'items_added', v_items_added
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', format('Failed to add items to inventory: %s', SQLERRM),
            'items_added', 0
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_quality_checked_items_to_inventory TO authenticated;

COMMENT ON FUNCTION add_quality_checked_items_to_inventory IS 'Adds quality-checked items to inventory with selling prices, updates stock, and marks purchase order as completed.';

