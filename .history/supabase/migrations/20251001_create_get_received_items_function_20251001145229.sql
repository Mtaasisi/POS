-- =====================================================
-- CREATE FUNCTION TO GET RECEIVED ITEMS FOR PURCHASE ORDER
-- =====================================================

-- This function retrieves all inventory items that were received
-- as part of a specific purchase order, including product details

CREATE OR REPLACE FUNCTION get_received_items_for_po(po_id UUID)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    variant_id UUID,
    serial_number TEXT,
    imei TEXT,
    mac_address TEXT,
    barcode TEXT,
    status VARCHAR(20),
    location TEXT,
    shelf TEXT,
    bin TEXT,
    purchase_date TIMESTAMPTZ,
    warranty_start DATE,
    warranty_end DATE,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ,
    product_name TEXT,
    product_sku TEXT,
    variant_name TEXT,
    variant_sku TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ii.id,
        ii.product_id,
        ii.variant_id,
        ii.serial_number,
        ii.imei,
        ii.mac_address,
        ii.barcode,
        ii.status,
        ii.location,
        ii.shelf,
        ii.bin,
        ii.purchase_date,
        ii.warranty_start,
        ii.warranty_end,
        ii.cost_price,
        ii.selling_price,
        ii.notes,
        ii.created_at,
        p.name as product_name,
        p.sku as product_sku,
        pv.name as variant_name,
        pv.sku as variant_sku
    FROM inventory_items ii
    LEFT JOIN lats_products p ON ii.product_id = p.id
    LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id
    WHERE ii.metadata->>'purchase_order_id' = po_id::TEXT
    ORDER BY ii.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_received_items_for_po IS 'Retrieves all inventory items that were received as part of a specific purchase order';

