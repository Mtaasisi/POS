-- ENHANCED INVENTORY MANAGEMENT SYSTEM
-- This script works directly in Supabase SQL Editor
-- Run this SQL directly in your Supabase SQL Editor

-- Step 1: Create audit trail table for inventory item changes
CREATE TABLE IF NOT EXISTS inventory_item_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for audit table
CREATE INDEX IF NOT EXISTS idx_inventory_item_audit_item_id ON inventory_item_audit(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item_audit_changed_at ON inventory_item_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_inventory_item_audit_changed_by ON inventory_item_audit(changed_by);

-- Enable RLS on audit table
ALTER TABLE inventory_item_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit table (drop first if exists)
DROP POLICY IF EXISTS "Users can view inventory item audit" ON inventory_item_audit;
CREATE POLICY "Users can view inventory item audit" ON inventory_item_audit
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Step 2: Ensure inventory_items table has all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'warranty_start') THEN
        ALTER TABLE inventory_items ADD COLUMN warranty_start DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'warranty_end') THEN
        ALTER TABLE inventory_items ADD COLUMN warranty_end DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'selling_price') THEN
        ALTER TABLE inventory_items ADD COLUMN selling_price DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'mac_address') THEN
        ALTER TABLE inventory_items ADD COLUMN mac_address VARCHAR(17);
    END IF;
END $$;

-- Step 3: Create enhanced RPC functions

-- Function to update inventory item status with audit trail
CREATE OR REPLACE FUNCTION update_inventory_item_status(
    item_id UUID,
    new_status TEXT,
    reason TEXT DEFAULT NULL,
    location TEXT DEFAULT NULL,
    shelf TEXT DEFAULT NULL,
    bin TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    old_record RECORD;
    new_record RECORD;
    user_id UUID;
BEGIN
    -- Get current user
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Get current item record
    SELECT * INTO old_record FROM inventory_items WHERE id = item_id;
    IF old_record IS NULL THEN
        RAISE EXCEPTION 'Inventory item not found';
    END IF;
    
    -- Update the item
    UPDATE inventory_items 
    SET 
        status = new_status,
        location = COALESCE(location, inventory_items.location),
        shelf = COALESCE(shelf, inventory_items.shelf),
        bin = COALESCE(bin, inventory_items.bin),
        updated_at = NOW()
    WHERE id = item_id
    RETURNING * INTO new_record;
    
    -- Create audit trail entries
    IF old_record.status != new_status THEN
        INSERT INTO inventory_item_audit (
            inventory_item_id, field_name, old_value, new_value, 
            changed_by, reason
        ) VALUES (
            item_id, 'status', old_record.status, new_status, 
            user_id, reason
        );
    END IF;
    
    IF old_record.location != new_record.location THEN
        INSERT INTO inventory_item_audit (
            inventory_item_id, field_name, old_value, new_value, 
            changed_by, reason
        ) VALUES (
            item_id, 'location', old_record.location, new_record.location, 
            user_id, reason
        );
    END IF;
    
    IF old_record.shelf != new_record.shelf THEN
        INSERT INTO inventory_item_audit (
            inventory_item_id, field_name, old_value, new_value, 
            changed_by, reason
        ) VALUES (
            item_id, 'shelf', old_record.shelf, new_record.shelf, 
            user_id, reason
        );
    END IF;
    
    IF old_record.bin != new_record.bin THEN
        INSERT INTO inventory_item_audit (
            inventory_item_id, field_name, old_value, new_value, 
            changed_by, reason
        ) VALUES (
            item_id, 'bin', old_record.bin, new_record.bin, 
            user_id, reason
        );
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update inventory item: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for bulk status updates
CREATE OR REPLACE FUNCTION bulk_update_inventory_status(
    item_ids UUID[],
    new_status TEXT,
    reason TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    item_id UUID;
    updated_count INTEGER := 0;
    user_id UUID;
BEGIN
    -- Get current user
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Update each item
    FOREACH item_id IN ARRAY item_ids
    LOOP
        IF update_inventory_item_status(item_id, new_status, reason) THEN
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to bulk update inventory items: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inventory item history
CREATE OR REPLACE FUNCTION get_inventory_item_history(item_id UUID)
RETURNS TABLE (
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ia.field_name,
        ia.old_value,
        ia.new_value,
        COALESCE(au.email, 'Unknown User') as changed_by,
        ia.changed_at,
        ia.reason
    FROM inventory_item_audit ia
    LEFT JOIN auth.users au ON ia.changed_by = au.id
    WHERE ia.inventory_item_id = item_id
    ORDER BY ia.changed_at DESC;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to get inventory item history: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inventory statistics for purchase order
CREATE OR REPLACE FUNCTION get_po_inventory_stats(po_id UUID)
RETURNS TABLE (
    status TEXT,
    count BIGINT,
    total_value DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ii.status,
        COUNT(*) as count,
        COALESCE(SUM(ii.cost_price), 0) as total_value
    FROM inventory_items ii
    WHERE ii.metadata->>'purchase_order_id' = po_id::TEXT
    GROUP BY ii.status
    ORDER BY ii.status;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to get inventory stats: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inventory items with enhanced filtering
CREATE OR REPLACE FUNCTION get_inventory_items_enhanced(
    po_id UUID DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    location_filter TEXT DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
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
    WHERE 
        (po_id IS NULL OR ii.metadata->>'purchase_order_id' = po_id::TEXT)
        AND (status_filter IS NULL OR ii.status = status_filter)
        AND (location_filter IS NULL OR ii.location = location_filter)
        AND (
            search_term IS NULL OR 
            ii.serial_number ILIKE '%' || search_term || '%' OR
            ii.imei ILIKE '%' || search_term || '%' OR
            p.name ILIKE '%' || search_term || '%' OR
            p.sku ILIKE '%' || search_term || '%'
        )
        AND (date_from IS NULL OR ii.created_at >= date_from)
        AND (date_to IS NULL OR ii.created_at <= date_to)
    ORDER BY ii.created_at DESC;
END;
$$;

-- Function to get warranty expiring items
CREATE OR REPLACE FUNCTION get_warranty_expiring_items(
    days_ahead INTEGER DEFAULT 30
) RETURNS TABLE (
    id UUID,
    product_name TEXT,
    serial_number TEXT,
    warranty_end DATE,
    days_until_expiry INTEGER,
    status TEXT,
    location TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ii.id,
        p.name as product_name,
        ii.serial_number,
        ii.warranty_end,
        (ii.warranty_end - CURRENT_DATE) as days_until_expiry,
        ii.status,
        ii.location
    FROM inventory_items ii
    LEFT JOIN lats_products p ON ii.product_id = p.id
    WHERE 
        ii.warranty_end IS NOT NULL 
        AND ii.warranty_end <= (CURRENT_DATE + INTERVAL '1 day' * days_ahead)
        AND ii.status IN ('available', 'reserved')
    ORDER BY ii.warranty_end ASC;
END;
$$;

-- Function to get inventory value summary
CREATE OR REPLACE FUNCTION get_inventory_value_summary(
    po_id UUID DEFAULT NULL
) RETURNS TABLE (
    total_items BIGINT,
    total_cost_value DECIMAL(15,2),
    total_selling_value DECIMAL(15,2),
    potential_profit DECIMAL(15,2),
    items_by_status JSONB
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    items_count BIGINT;
    cost_val DECIMAL(15,2);
    sell_val DECIMAL(15,2);
    profit DECIMAL(15,2);
    status_breakdown JSONB;
BEGIN
    -- Get counts and values
    SELECT 
        COUNT(*),
        COALESCE(SUM(ii.cost_price), 0),
        COALESCE(SUM(ii.selling_price), 0),
        COALESCE(SUM(ii.selling_price - ii.cost_price), 0)
    INTO items_count, cost_val, sell_val, profit
    FROM inventory_items ii
    WHERE (po_id IS NULL OR ii.metadata->>'purchase_order_id' = po_id::TEXT);
    
    -- Get status breakdown
    SELECT jsonb_object_agg(status, count)
    INTO status_breakdown
    FROM (
        SELECT 
            ii.status,
            COUNT(*) as count
        FROM inventory_items ii
        WHERE (po_id IS NULL OR ii.metadata->>'purchase_order_id' = po_id::TEXT)
        GROUP BY ii.status
    ) status_counts;
    
    RETURN QUERY SELECT 
        items_count,
        cost_val,
        sell_val,
        profit,
        status_breakdown;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION update_inventory_item_status(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_inventory_status(UUID[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_item_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_po_inventory_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_items_enhanced(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_warranty_expiring_items(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_value_summary(UUID) TO authenticated;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_warranty_end ON inventory_items(warranty_end) WHERE warranty_end IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_cost_price ON inventory_items(cost_price) WHERE cost_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_selling_price ON inventory_items(selling_price) WHERE selling_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON inventory_items(barcode) WHERE barcode IS NOT NULL;

-- Step 6: Create enhanced view
CREATE OR REPLACE VIEW inventory_items_view AS
SELECT 
    ii.*,
    p.name as product_name,
    p.sku as product_sku,
    pv.name as variant_name,
    pv.sku as variant_sku,
    (ii.selling_price - ii.cost_price) as profit_margin,
    CASE 
        WHEN ii.cost_price > 0 THEN (ii.selling_price / ii.cost_price - 1) * 100 
        ELSE 0 
    END as profit_percentage,
    CASE 
        WHEN ii.warranty_end IS NULL THEN NULL
        WHEN ii.warranty_end < CURRENT_DATE THEN 'expired'
        WHEN ii.warranty_end <= (CURRENT_DATE + INTERVAL '30 days') THEN 'expiring_soon'
        ELSE 'valid'
    END as warranty_status,
    (ii.warranty_end - CURRENT_DATE) as warranty_days_remaining
FROM inventory_items ii
LEFT JOIN lats_products p ON ii.product_id = p.id
LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id;

-- Grant access to the view
GRANT SELECT ON inventory_items_view TO authenticated;

-- Success message
SELECT 'Enhanced inventory management system successfully installed! All features are now available.' as message;
