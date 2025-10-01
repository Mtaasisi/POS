-- Fix received items RPC function
-- This script creates the missing RPC function for getting received items

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);
DROP FUNCTION IF EXISTS get_po_received_items(UUID);

-- Create the RPC function to get received items for a purchase order
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
    FROM lats_inventory_items ii
    LEFT JOIN lats_products p ON ii.product_id = p.id
    LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id
    WHERE ii.purchase_order_id = po_id
    ORDER BY ii.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Alternative function to get received items from purchase order items
CREATE OR REPLACE FUNCTION get_po_received_items(po_id UUID)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    variant_id UUID,
    product_name TEXT,
    product_sku TEXT,
    variant_name TEXT,
    variant_sku TEXT,
    quantity_ordered INTEGER,
    quantity_received INTEGER,
    cost_price DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        poi.id,
        poi.product_id,
        poi.variant_id,
        p.name as product_name,
        p.sku as product_sku,
        pv.name as variant_name,
        pv.sku as variant_sku,
        poi.quantity as quantity_ordered,
        COALESCE(poi.received_quantity, 0) as quantity_received,
        poi.cost_price,
        (poi.quantity * poi.cost_price) as total_cost,
        CASE 
            WHEN COALESCE(poi.received_quantity, 0) = 0 THEN 'pending'
            WHEN COALESCE(poi.received_quantity, 0) < poi.quantity THEN 'partial'
            WHEN COALESCE(poi.received_quantity, 0) >= poi.quantity THEN 'received'
            ELSE 'unknown'
        END as status,
        poi.created_at
    FROM lats_purchase_order_items poi
    LEFT JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    WHERE poi.purchase_order_id = po_id
    ORDER BY poi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_po_received_items(UUID) TO authenticated;

SELECT 'Received items RPC functions created successfully!' as status;
