-- SIMPLIFIED FIX FOR RPC FUNCTIONS - 400 Bad Request Errors
-- This script creates the missing RPC functions with minimal complexity
-- Run this SQL directly in your Supabase SQL Editor

-- Step 1: Drop all existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(UUID);
DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(TEXT);
DROP FUNCTION IF EXISTS get_po_inventory_stats(UUID);
DROP FUNCTION IF EXISTS get_po_inventory_stats(TEXT);
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);
DROP FUNCTION IF EXISTS get_received_items_for_po(TEXT);

-- Step 2: Create get_purchase_order_items_with_products function
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
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        poi.id,
        poi.purchase_order_id,
        poi.product_id,
        poi.variant_id,
        poi.quantity,
        poi.unit_cost,
        poi.total_cost,
        COALESCE(poi.received_quantity, 0) as received_quantity,
        (poi.quantity - COALESCE(poi.received_quantity, 0)) as remaining_quantity,
        COALESCE(poi.status, 'pending') as status,
        poi.notes,
        poi.created_at,
        poi.updated_at,
        COALESCE(p.name, 'Unknown Product') as product_name,
        COALESCE(p.sku, '') as product_sku,
        COALESCE(p.description, '') as product_description,
        COALESCE(p.category, '') as product_category,
        COALESCE(p.brand, '') as product_brand,
        COALESCE(pv.name, '') as variant_name,
        COALESCE(pv.sku, '') as variant_sku,
        COALESCE(pv.attributes, '{}'::JSONB) as variant_attributes,
        CASE 
            WHEN poi.quantity > 0 THEN 
                ROUND((COALESCE(poi.received_quantity, 0)::DECIMAL / poi.quantity::DECIMAL) * 100, 2)
            ELSE 0 
        END as completion_percentage,
        (COALESCE(poi.received_quantity, 0) >= poi.quantity) as is_fully_received
    FROM lats_purchase_order_items poi
    LEFT JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    WHERE poi.purchase_order_id = purchase_order_id_param
    ORDER BY poi.created_at DESC;
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
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ii.status, 'unknown') as status,
        COUNT(*) as count,
        COALESCE(SUM(ii.cost_price), 0) as total_value
    FROM inventory_items ii
    WHERE ii.metadata->>'purchase_order_id' = po_id::TEXT
    GROUP BY ii.status
    ORDER BY ii.status;
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
AS $$
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
        COALESCE(ii.status, 'available') as status,
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
        COALESCE(p.name, 'Unknown Product') as product_name,
        COALESCE(p.sku, '') as product_sku,
        COALESCE(pv.name, '') as variant_name,
        COALESCE(pv.sku, '') as variant_sku
    FROM inventory_items ii
    LEFT JOIN lats_products p ON ii.product_id = p.id
    LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id
    WHERE ii.metadata->>'purchase_order_id' = po_id::TEXT
    AND ii.id IS NOT NULL
    ORDER BY ii.created_at DESC;
END;
$$;

-- Step 5: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_purchase_order_items_with_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_po_inventory_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Step 6: Test the functions exist
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN (
    'get_purchase_order_items_with_products',
    'get_po_inventory_stats', 
    'get_received_items_for_po'
)
AND routine_schema = 'public'
ORDER BY routine_name;

-- Success message
SELECT 'RPC functions created successfully! Test your application now.' as message;
