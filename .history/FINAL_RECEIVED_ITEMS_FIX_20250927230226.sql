-- FINAL FIX FOR get_received_items_for_po FUNCTION
-- This will fix the remaining "structure of query does not match function result type" error

-- Drop the problematic function
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);

-- Create the corrected get_received_items_for_po function
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
    variant_sku TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF po_id IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID cannot be null';
    END IF;
    
    RETURN QUERY
    SELECT 
        ii.id,
        ii.product_id,
        ii.variant_id,
        COALESCE(ii.serial_number, ''::TEXT)::TEXT as serial_number,
        COALESCE(ii.imei, ''::TEXT)::TEXT as imei,
        COALESCE(ii.mac_address, ''::TEXT)::TEXT as mac_address,
        COALESCE(ii.barcode, ''::TEXT)::TEXT as barcode,
        COALESCE(ii.status, 'available')::TEXT as status,
        COALESCE(ii.location, ''::TEXT)::TEXT as location,
        COALESCE(ii.shelf, ''::TEXT)::TEXT as shelf,
        COALESCE(ii.bin, ''::TEXT)::TEXT as bin,
        ii.purchase_date,
        ii.warranty_start,
        ii.warranty_end,
        ii.cost_price::DECIMAL(15,2),
        ii.selling_price::DECIMAL(15,2),
        COALESCE(ii.notes, ''::TEXT)::TEXT as notes,
        ii.created_at,
        COALESCE(p.name, 'Unknown Product')::TEXT as product_name,
        COALESCE(p.sku, '')::TEXT as product_sku,
        COALESCE(pv.name, '')::TEXT as variant_name,
        COALESCE(pv.sku, '')::TEXT as variant_sku
    FROM inventory_items ii
    LEFT JOIN lats_products p ON ii.product_id = p.id
    LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id
    WHERE ii.metadata->>'purchase_order_id' = po_id::TEXT
    AND ii.id IS NOT NULL
    
    UNION ALL
    
    SELECT 
        lia.id,
        lia.product_id,
        lia.variant_id,
        ''::TEXT as serial_number,
        ''::TEXT as imei,
        ''::TEXT as mac_address,
        ''::TEXT as barcode,
        'received'::TEXT as status,
        ''::TEXT as location,
        ''::TEXT as shelf,
        ''::TEXT as bin,
        lia.created_at as purchase_date,
        NULL::TIMESTAMPTZ as warranty_start,
        NULL::TIMESTAMPTZ as warranty_end,
        lia.cost_price::DECIMAL(15,2),
        NULL::DECIMAL(15,2) as selling_price,
        COALESCE(lia.reason, '')::TEXT as notes,
        lia.created_at,
        COALESCE(p.name, 'Unknown Product')::TEXT as product_name,
        COALESCE(p.sku, '')::TEXT as product_sku,
        COALESCE(pv.name, '')::TEXT as variant_name,
        COALESCE(pv.sku, '')::TEXT as variant_sku
    FROM lats_inventory_adjustments lia
    LEFT JOIN lats_products p ON lia.product_id = p.id
    LEFT JOIN lats_product_variants pv ON lia.variant_id = pv.id
    WHERE lia.purchase_order_id = po_id
    AND lia.adjustment_type = 'receive'
    AND lia.id IS NOT NULL
    
    ORDER BY created_at DESC;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_received_items_for_po for PO %: %', po_id, SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Success message
SELECT '🎉 FINAL FIX APPLIED! get_received_items_for_po function has been corrected!' as message;
