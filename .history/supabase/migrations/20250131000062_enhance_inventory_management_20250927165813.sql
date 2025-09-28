-- Enhanced Inventory Management System
-- Migration: 20250131000062_enhance_inventory_management.sql

-- Create audit trail table for inventory item changes
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

-- Create RLS policies for audit table
CREATE POLICY "Users can view inventory item audit" ON inventory_item_audit
    FOR SELECT USING (auth.uid() IS NOT NULL);

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_inventory_item_status(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_inventory_status(UUID[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_item_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_po_inventory_stats(UUID) TO authenticated;
