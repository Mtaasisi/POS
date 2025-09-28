-- ULTIMATE FIX FOR RPC FUNCTIONS - MATCHES EXACT TABLE STRUCTURE
-- This will fix the "structure of query does not match function result type" error

-- Step 1: Drop existing functions
DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(UUID);
DROP FUNCTION IF EXISTS get_po_inventory_stats(UUID);
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);

-- Step 2: Create get_purchase_order_items_with_products function
-- This function matches your exact table structure
CREATE OR REPLACE FUNCTION get_purchase_order_items_with_products(purchase_order_id_param UUID)
RETURNS TABLE (
    id UUID,
    purchase_order_id UUID,
    product_id UUID,
    variant_id UUID,
    quantity INTEGER,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    received_quantity INTEGER,
    remaining_quantity INTEGER,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    product_name TEXT,
    product_sku TEXT,
    product_description TEXT,
    product_category TEXT,
    product_brand TEXT,
    variant_name TEXT,
    variant_sku TEXT,
    variant_attributes JSONB,
    completion_percentage DECIMAL(5,2),
    is_fully_received BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF purchase_order_id_param IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID parameter cannot be null';
    END IF;
    
    RETURN QUERY
    SELECT 
        poi.id,
        poi.purchase_order_id,
        poi.product_id,
        poi.variant_id,
        poi.quantity,
        poi.cost_price::DECIMAL(15,2) as unit_cost,
        poi.total_price::DECIMAL(15,2) as total_cost,
        COALESCE(poi.received_quantity, 0)::INTEGER as received_quantity,
        (poi.quantity - COALESCE(poi.received_quantity, 0))::INTEGER as remaining_quantity,
        'pending'::TEXT as status,
        poi.notes,
        poi.created_at,
        poi.updated_at,
        COALESCE(p.name, 'Unknown Product')::TEXT as product_name,
        COALESCE(p.sku, '')::TEXT as product_sku,
        COALESCE(p.description, '')::TEXT as product_description,
        COALESCE(p.category, '')::TEXT as product_category,
        COALESCE(p.brand, '')::TEXT as product_brand,
        COALESCE(pv.name, '')::TEXT as variant_name,
        COALESCE(pv.sku, '')::TEXT as variant_sku,
        COALESCE(pv.attributes, '{}'::JSONB) as variant_attributes,
        CASE 
            WHEN poi.quantity > 0 THEN 
                ROUND((COALESCE(poi.received_quantity, 0)::DECIMAL / poi.quantity::DECIMAL) * 100, 2)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END as completion_percentage,
        (COALESCE(poi.received_quantity, 0) >= poi.quantity)::BOOLEAN as is_fully_received
    FROM lats_purchase_order_items poi
    LEFT JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    WHERE poi.purchase_order_id = purchase_order_id_param
    ORDER BY poi.created_at DESC;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_purchase_order_items_with_products for PO %: %', purchase_order_id_param, SQLERRM;
END;
$$;

-- Step 3: Create get_po_inventory_stats function
CREATE OR REPLACE FUNCTION get_po_inventory_stats(po_id UUID)
RETURNS TABLE (
    status TEXT,
    count BIGINT,
    total_value DECIMAL(15,2)
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
        COALESCE(ii.status, 'unknown')::TEXT as status,
        COUNT(*)::BIGINT as count,
        COALESCE(SUM(ii.cost_price), 0)::DECIMAL(15,2) as total_value
    FROM inventory_items ii
    WHERE ii.metadata->>'purchase_order_id' = po_id::TEXT
    GROUP BY ii.status
    ORDER BY ii.status;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_po_inventory_stats for PO %: %', po_id, SQLERRM;
END;
$$;

-- Step 4: Create get_received_items_for_po function
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
        ii.serial_number,
        ii.imei,
        ii.mac_address,
        ii.barcode,
        COALESCE(ii.status, 'available')::TEXT as status,
        ii.location,
        ii.shelf,
        ii.bin,
        ii.purchase_date,
        ii.warranty_start,
        ii.warranty_end,
        ii.cost_price::DECIMAL(15,2),
        ii.selling_price::DECIMAL(15,2),
        ii.notes,
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
        NULL::TEXT as serial_number,
        NULL::TEXT as imei,
        NULL::TEXT as mac_address,
        NULL::TEXT as barcode,
        'received'::TEXT as status,
        NULL::TEXT as location,
        NULL::TEXT as shelf,
        NULL::TEXT as bin,
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

-- Step 5: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_purchase_order_items_with_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_po_inventory_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Success message
SELECT '🎉 ULTIMATE FIX APPLIED! All RPC functions have been created with explicit type casting!' as message;
