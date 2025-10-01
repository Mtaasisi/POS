-- Fix get_received_items_for_po RPC function with correct table structure
-- Migration: 20251001_fix_get_received_items_function.sql

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);

-- Create the corrected RPC function to get received items for a purchase order
-- This function combines data from both inventory_adjustments and inventory_items tables
CREATE OR REPLACE FUNCTION get_received_items_for_po(po_id UUID)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    variant_id UUID,
    serial_number TEXT,
    imei TEXT,
    mac_address TEXT,
    barcode TEXT,
    status TEXT,
    location TEXT,
    shelf TEXT,
    bin TEXT,
    purchase_date TIMESTAMPTZ,
    warranty_start TIMESTAMPTZ,
    warranty_end TIMESTAMPTZ,
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ,
    product_name TEXT,
    product_sku TEXT,
    variant_name TEXT,
    variant_sku TEXT,
    quantity INTEGER,
    item_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Get inventory adjustments (non-serialized items)
    SELECT 
        lia.id,
        lia.product_id,
        lia.variant_id,
        NULL::TEXT as serial_number,
        NULL::TEXT as imei,
        NULL::TEXT as mac_address,
        NULL::TEXT as barcode,
        'received'::TEXT as status,
        NULL::TEXT as location,
        NULL::TEXT as shelf,
        NULL::TEXT as bin,
        lia.created_at::TIMESTAMPTZ as purchase_date,
        NULL::TIMESTAMPTZ as warranty_start,
        NULL::TIMESTAMPTZ as warranty_end,
        lia.cost_price,
        NULL::DECIMAL(15,2) as selling_price,
        lia.reason as notes,
        lia.created_at,
        p.name as product_name,
        p.sku as product_sku,
        pv.name as variant_name,
        pv.sku as variant_sku,
        lia.quantity,
        'adjustment'::TEXT as item_type
    FROM lats_inventory_adjustments lia
    LEFT JOIN lats_products p ON lia.product_id = p.id
    LEFT JOIN lats_product_variants pv ON lia.variant_id = pv.id
    WHERE lia.purchase_order_id = po_id
    AND lia.adjustment_type = 'receive'
    
    UNION ALL
    
    -- Get inventory items (serialized items)
    SELECT 
        ii.id,
        ii.product_id,
        ii.variant_id,
        ii.serial_number::TEXT,
        ii.imei::TEXT,
        ii.mac_address::TEXT,
        ii.barcode::TEXT,
        ii.status,
        ii.location::TEXT,
        ii.shelf::TEXT,
        ii.bin::TEXT,
        ii.purchase_date::TIMESTAMPTZ,
        ii.warranty_start::TIMESTAMPTZ,
        ii.warranty_end::TIMESTAMPTZ,
        ii.cost_price,
        ii.selling_price,
        ii.notes::TEXT,
        ii.created_at,
        p.name as product_name,
        p.sku as product_sku,
        pv.name as variant_name,
        pv.sku as variant_sku,
        1 as quantity, -- Each inventory item represents 1 unit
        'inventory_item'::TEXT as item_type
    FROM inventory_items ii
    LEFT JOIN lats_products p ON ii.product_id = p.id
    LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id
    WHERE ii.metadata->>'purchase_order_id' = po_id::TEXT
    
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_received_items_for_po(UUID) IS 'Returns all received items for a purchase order from both inventory adjustments and inventory items tables';
