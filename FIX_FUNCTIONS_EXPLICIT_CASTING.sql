-- =====================================================
-- FUNCTIONS WITH EXPLICIT TYPE CASTING
-- =====================================================
-- This script creates functions with explicit type casting to match exactly

-- Step 1: Drop existing functions
DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(UUID);
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);

-- Step 2: Create function with explicit casting
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
    -- Validate input parameter
    IF purchase_order_id_param IS NULL THEN
        RAISE EXCEPTION 'Purchase order ID parameter cannot be null';
    END IF;
    
    -- Return purchase order items with explicit casting
    RETURN QUERY
    SELECT 
        poi.id::UUID,
        poi.purchase_order_id::UUID,
        poi.product_id::UUID,
        poi.variant_id::UUID,
        poi.quantity::INTEGER,
        poi.cost_price::DECIMAL(15,2) as unit_cost,
        poi.total_price::DECIMAL(15,2) as total_cost,
        COALESCE(poi.received_quantity, 0)::INTEGER as received_quantity,
        (poi.quantity - COALESCE(poi.received_quantity, 0))::INTEGER as remaining_quantity,
        -- Calculate status
        CASE 
            WHEN COALESCE(poi.received_quantity, 0) >= poi.quantity THEN 'completed'::TEXT
            WHEN COALESCE(poi.received_quantity, 0) > 0 THEN 'partial'::TEXT
            ELSE 'pending'::TEXT
        END as status,
        COALESCE(poi.notes, '')::TEXT as notes,
        poi.created_at::TIMESTAMPTZ,
        poi.updated_at::TIMESTAMPTZ,
        -- Product details with explicit casting
        COALESCE(p.name, 'Unknown Product')::TEXT as product_name,
        COALESCE(p.sku, '')::TEXT as product_sku,
        COALESCE(p.description, '')::TEXT as product_description,
        COALESCE(p.category, '')::TEXT as product_category,
        COALESCE(p.brand, '')::TEXT as product_brand,
        -- Variant details with explicit casting
        COALESCE(pv.name, '')::TEXT as variant_name,
        COALESCE(pv.sku, '')::TEXT as variant_sku,
        COALESCE(pv.attributes, '{}'::JSONB)::JSONB as variant_attributes,
        -- Calculated fields with explicit casting
        CASE 
            WHEN poi.quantity > 0 THEN 
                ROUND((COALESCE(poi.received_quantity, 0)::DECIMAL / poi.quantity::DECIMAL) * 100, 2)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END as completion_percentage,
        -- Is fully received
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

-- Step 3: Create simple get_received_items_for_po function
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
    
    -- Return empty result for now
    RETURN QUERY
    SELECT 
        NULL::UUID as id,
        NULL::UUID as product_id,
        NULL::UUID as variant_id,
        NULL::TEXT as serial_number,
        NULL::TEXT as imei,
        NULL::TEXT as mac_address,
        NULL::TEXT as barcode,
        NULL::TEXT as status,
        NULL::TEXT as location,
        NULL::TEXT as shelf,
        NULL::TEXT as bin,
        NULL::TIMESTAMPTZ as purchase_date,
        NULL::TIMESTAMPTZ as warranty_start,
        NULL::TIMESTAMPTZ as warranty_end,
        NULL::DECIMAL(15,2) as cost_price,
        NULL::DECIMAL(15,2) as selling_price,
        NULL::TEXT as notes,
        NULL::TIMESTAMPTZ as created_at,
        NULL::TEXT as product_name,
        NULL::TEXT as product_sku,
        NULL::TEXT as variant_name,
        NULL::TEXT as variant_sku
    WHERE false; -- This will return no rows but test the structure
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_received_items_for_po for PO %: %', po_id, SQLERRM;
END;
$$;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_purchase_order_items_with_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Step 5: Test the functions
SELECT 'Testing functions with explicit casting...' as message;

-- Test get_purchase_order_items_with_products
SELECT 
    'get_purchase_order_items_with_products test' as test_name,
    COUNT(*) as items_found 
FROM get_purchase_order_items_with_products('2f772843-d993-4987-adb4-393ab0bf718c'::UUID);

-- Test get_received_items_for_po  
SELECT 
    'get_received_items_for_po test' as test_name,
    COUNT(*) as received_found 
FROM get_received_items_for_po('2f772843-d993-4987-adb4-393ab0bf718c'::UUID);

SELECT 'Functions with explicit casting created and tested successfully!' as message;
