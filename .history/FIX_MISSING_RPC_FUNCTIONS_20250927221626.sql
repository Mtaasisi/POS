-- COMPREHENSIVE FIX FOR MISSING RPC FUNCTIONS
-- This script fixes all the 404 and 400 errors in the purchase order system
-- Run this SQL directly in your Supabase SQL Editor

-- Step 1: Drop existing functions with any signatures to avoid conflicts
DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(UUID);
DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(TEXT);
DROP FUNCTION IF EXISTS get_po_inventory_stats(UUID);
DROP FUNCTION IF EXISTS get_po_inventory_stats(TEXT);
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);
DROP FUNCTION IF EXISTS get_received_items_for_po(TEXT);

-- Step 2: Create get_purchase_order_items_with_products function
-- This function returns purchase order items with full product details
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
    -- Product details
    product_name TEXT,
    product_sku TEXT,
    product_description TEXT,
    product_category TEXT,
    product_brand TEXT,
    -- Variant details
    variant_name TEXT,
    variant_sku TEXT,
    variant_attributes JSONB,
    -- Additional calculated fields
    completion_percentage DECIMAL(5,2),
    is_fully_received BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate input parameter
    IF purchase_order_id_param IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID parameter cannot be null';
    END IF;
    
    -- Return purchase order items with product details
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
        -- Product details
        COALESCE(p.name, 'Unknown Product') as product_name,
        COALESCE(p.sku, '') as product_sku,
        COALESCE(p.description, '') as product_description,
        COALESCE(p.category, '') as product_category,
        COALESCE(p.brand, '') as product_brand,
        -- Variant details
        COALESCE(pv.name, '') as variant_name,
        COALESCE(pv.sku, '') as variant_sku,
        COALESCE(pv.attributes, '{}'::JSONB) as variant_attributes,
        -- Calculated fields
        CASE 
            WHEN poi.quantity > 0 THEN 
                ROUND((COALESCE(poi.received_quantity, 0)::DECIMAL / poi.quantity::DECIMAL) * 100, 2)
            ELSE 0 
        END as completion_percentage,
        -- Is fully received
        (COALESCE(poi.received_quantity, 0) >= poi.quantity) as is_fully_received
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
-- This function returns inventory statistics for a purchase order
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
    -- Validate input parameter
    IF po_id IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID cannot be null';
    END IF;
    
    -- Return inventory statistics grouped by status
    RETURN QUERY
    SELECT 
        COALESCE(ii.status, 'unknown') as status,
        COUNT(*) as count,
        COALESCE(SUM(ii.cost_price), 0) as total_value
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
-- This function returns all received items (inventory items and adjustments) for a purchase order
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
    -- Validate input parameter
    IF po_id IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID cannot be null';
    END IF;
    
    -- Return inventory items (items with serial numbers)
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
    
    UNION ALL
    
    -- Return inventory adjustments (items without serial numbers)
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
        lia.cost_price,
        NULL::DECIMAL(15,2) as selling_price,
        COALESCE(lia.reason, '') as notes,
        lia.created_at,
        COALESCE(p.name, 'Unknown Product') as product_name,
        COALESCE(p.sku, '') as product_sku,
        COALESCE(pv.name, '') as variant_name,
        COALESCE(pv.sku, '') as variant_sku
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

-- Step 5: Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_purchase_order_items_with_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_po_inventory_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Step 6: Verify functions exist and have correct signatures
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
    'get_purchase_order_items_with_products',
    'get_po_inventory_stats', 
    'get_received_items_for_po'
)
AND routine_schema = 'public'
ORDER BY routine_name;

-- Step 7: Test the functions (optional - uncomment to test)
-- Replace with actual purchase order IDs from your database
/*
SELECT 'Testing get_purchase_order_items_with_products' as test_name;
SELECT * FROM get_purchase_order_items_with_products('your-po-id-here'::UUID) LIMIT 5;

SELECT 'Testing get_po_inventory_stats' as test_name;
SELECT * FROM get_po_inventory_stats('your-po-id-here'::UUID);

SELECT 'Testing get_received_items_for_po' as test_name;
SELECT * FROM get_received_items_for_po('your-po-id-here'::UUID) LIMIT 5;
*/

-- Success message
SELECT 'All missing RPC functions have been created successfully! The 404 and 400 errors should now be resolved.' as message;
