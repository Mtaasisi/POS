-- Complete fix for add_quality_checked_items_to_inventory function
-- This script will drop ALL possible variants and create the correct one

-- First, let's see what functions exist and drop them all
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Find all functions with this name and drop them
    FOR func_record IN 
        SELECT routine_name, specific_name
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'add_quality_checked_items_to_inventory'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_record.specific_name);
        RAISE NOTICE 'Dropped function: %', func_record.specific_name;
    END LOOP;
END $$;

-- Create the corrected function with proper parameter order
CREATE OR REPLACE FUNCTION add_quality_checked_items_to_inventory(
    p_quality_check_id UUID,
    p_purchase_order_id UUID,
    p_user_id UUID,
    p_profit_margin_percentage DECIMAL DEFAULT 30.0,
    p_default_location VARCHAR DEFAULT NULL
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

        -- Calculate selling price with profit margin
        v_cost_price := v_po_item_record.unit_cost;
        v_selling_price := v_cost_price * (1 + p_profit_margin_percentage / 100.0);

        IF v_total_passed > 0 THEN
            -- Create inventory adjustment
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
                price = v_selling_price,
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

    -- Log audit with JSONB format
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

-- Add comment for documentation
COMMENT ON FUNCTION add_quality_checked_items_to_inventory IS 'Adds quality-checked items to inventory with selling prices. Fixed parameter order to match frontend calls.';

-- Verify the function was created
SELECT 'Successfully created add_quality_checked_items_to_inventory function!' as status;
