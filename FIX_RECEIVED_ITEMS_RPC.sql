-- COMPREHENSIVE FIX FOR get_received_items_for_po RPC FUNCTION
-- This resolves the 400 Bad Request error when fetching received items
-- Run this SQL directly in your Supabase SQL Editor

-- Step 1: Drop existing function if it exists (with any signature)
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID);
DROP FUNCTION IF EXISTS get_received_items_for_po(UUID, TEXT);
DROP FUNCTION IF EXISTS get_received_items_for_po(TEXT);

-- Step 2: Ensure required tables exist and have proper structure
-- Check if inventory_items table exists and has metadata column
DO $$
BEGIN
    -- Create inventory_items table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
        CREATE TABLE inventory_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES lats_products(id) ON DELETE CASCADE,
            variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
            serial_number TEXT,
            imei TEXT,
            mac_address TEXT,
            barcode TEXT,
            status TEXT DEFAULT 'available',
            location TEXT,
            shelf TEXT,
            bin TEXT,
            purchase_date TIMESTAMPTZ,
            warranty_start TIMESTAMPTZ,
            warranty_end TIMESTAMPTZ,
            cost_price DECIMAL(15,2),
            selling_price DECIMAL(15,2),
            notes TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
        );
        
        -- Enable RLS
        ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view inventory items" ON inventory_items
            FOR SELECT USING (auth.uid() IS NOT NULL);
            
        CREATE POLICY "Users can insert inventory items" ON inventory_items
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
            
        CREATE POLICY "Users can update inventory items" ON inventory_items
            FOR UPDATE USING (auth.uid() IS NOT NULL);
            
        CREATE POLICY "Users can delete inventory items" ON inventory_items
            FOR DELETE USING (auth.uid() IS NOT NULL);
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'metadata') THEN
        ALTER TABLE inventory_items ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Step 3: Create the RPC function with proper error handling
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

-- Step 4: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;

-- Step 5: Test the function with a sample purchase order ID
-- (Replace with an actual purchase order ID from your database)
-- SELECT * FROM get_received_items_for_po('a5b9479b-482e-4c64-ae52-51345bcab362'::UUID);

-- Step 6: Verify function exists and has correct signature
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_received_items_for_po'
AND routine_schema = 'public';
