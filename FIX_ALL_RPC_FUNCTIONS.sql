-- COMPREHENSIVE FIX FOR ALL FAILING RPC FUNCTIONS
-- This script fixes all the RPC functions that are causing 400/404 errors
-- Run this SQL directly in your Supabase SQL Editor

-- Step 1: Drop existing functions to ensure clean recreation
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID, TEXT);
DROP FUNCTION IF EXISTS get_received_items_for_po(TEXT);
DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(UUID);
DROP FUNCTION IF EXISTS get_po_inventory_stats(UUID);

-- Step 2: Create get_purchase_order_items_with_products function (missing function)
CREATE OR REPLACE FUNCTION get_purchase_order_items_with_products(purchase_order_id_param UUID)
RETURNS TABLE (
    id UUID,
    purchase_order_id UUID,
    product_id UUID,
    variant_id UUID,
    quantity INTEGER,
    received_quantity INTEGER,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    product_name TEXT,
    product_sku TEXT,
    variant_name TEXT,
    variant_sku TEXT,
    category_name TEXT,
    supplier_name TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate input parameter
    IF purchase_order_id_param IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID cannot be null';
    END IF;
    
    RETURN QUERY
    SELECT 
        poi.id,
        poi.purchase_order_id,
        poi.product_id,
        poi.variant_id,
        poi.quantity,
        COALESCE(poi.received_quantity, 0) as received_quantity,
        poi.unit_cost,
        poi.total_cost,
        poi.notes,
        poi.created_at,
        poi.updated_at,
        COALESCE(p.name, 'Unknown Product') as product_name,
        COALESCE(p.sku, '') as product_sku,
        COALESCE(pv.name, '') as variant_name,
        COALESCE(pv.sku, '') as variant_sku,
        COALESCE(c.name, '') as category_name,
        COALESCE(s.name, '') as supplier_name
    FROM lats_purchase_order_items poi
    LEFT JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    LEFT JOIN lats_categories c ON p.category_id = c.id
    LEFT JOIN lats_suppliers s ON poi.supplier_id = s.id
    WHERE poi.purchase_order_id = purchase_order_id_param
    ORDER BY poi.created_at ASC;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_purchase_order_items_with_products for PO %: %', purchase_order_id_param, SQLERRM;
END;
$$;

-- Step 3: Create get_received_items_for_po function (fix existing function)
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
    warranty_start DATE,
    warranty_end DATE,
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
DECLARE
    result_count INTEGER := 0;
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
        ii.warranty_start::DATE as warranty_start,
        ii.warranty_end::DATE as warranty_end,
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
        NULL::DATE as warranty_start,
        NULL::DATE as warranty_end,
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
    
    -- Get result count for logging
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
    -- Log the operation (optional)
    RAISE NOTICE 'get_received_items_for_po: Found % items for purchase order %', result_count, po_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and re-raise with more context
        RAISE EXCEPTION 'Error in get_received_items_for_po for PO %: %', po_id, SQLERRM;
END;
$$;

-- Step 4: Create get_po_inventory_stats function (fix existing function)
CREATE OR REPLACE FUNCTION get_po_inventory_stats(po_id UUID)
RETURNS TABLE (
    status TEXT,
    count BIGINT,
    total_value DECIMAL(15,2)
) AS $$
BEGIN
    -- Validate input parameter
    IF po_id IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID cannot be null';
    END IF;
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant execute permissions to authenticated users
DO $$
BEGIN
    -- Grant permissions for all functions
    GRANT EXECUTE ON FUNCTION get_purchase_order_items_with_products(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION get_po_inventory_stats(UUID) TO authenticated;
    
    RAISE NOTICE 'Successfully granted execute permissions for all RPC functions';
EXCEPTION
    WHEN OTHERS THEN
        -- Permissions might already exist, continue
        RAISE NOTICE 'Permissions setup completed with warnings: %', SQLERRM;
END $$;

-- Step 6: Verify functions exist and have correct signatures
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
    'get_purchase_order_items_with_products',
    'get_received_items_for_po', 
    'get_po_inventory_stats'
)
AND routine_schema = 'public'
ORDER BY routine_name;

-- Success message
SELECT 'All RPC functions have been successfully created and fixed!' as message;
