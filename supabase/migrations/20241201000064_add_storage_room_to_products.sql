-- Add Storage Room Reference to Products Table
-- Migration: 20241201000064_add_storage_room_to_products.sql

-- Add storage_room_id column to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS storage_room_id UUID REFERENCES lats_storage_rooms(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_storage_room ON lats_products(storage_room_id);

-- Enable the storage room capacity trigger
CREATE TRIGGER update_storage_room_capacity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lats_products
    FOR EACH ROW
    EXECUTE FUNCTION update_storage_room_capacity();

-- Add storage_room_id to RLS policies for lats_products
-- Note: The existing RLS policies should already cover this new column
-- since they use 'FOR ALL' which includes all columns

-- Update the product totals function to consider storage room capacity
CREATE OR REPLACE FUNCTION update_product_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lats_products 
    SET 
        total_quantity = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM lats_product_variants 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        total_value = (
            SELECT COALESCE(SUM(quantity * cost_price), 0) 
            FROM lats_product_variants 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create a function to get storage room statistics
CREATE OR REPLACE FUNCTION get_storage_room_stats(storage_room_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', (SELECT COUNT(*) FROM lats_products WHERE storage_room_id = $1),
        'total_quantity', (SELECT COALESCE(SUM(total_quantity), 0) FROM lats_products WHERE storage_room_id = $1),
        'total_value', (SELECT COALESCE(SUM(total_value), 0) FROM lats_products WHERE storage_room_id = $1),
        'low_stock_products', (SELECT COUNT(*) FROM lats_products WHERE storage_room_id = $1 AND total_quantity <= 10),
        'out_of_stock_products', (SELECT COUNT(*) FROM lats_products WHERE storage_room_id = $1 AND total_quantity = 0)
    ) INTO result;
    
    RETURN result;
END;
$$ language 'plpgsql';

-- Create a function to move products between storage rooms
CREATE OR REPLACE FUNCTION move_products_to_storage_room(
    product_ids UUID[],
    new_storage_room_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    product_id UUID;
    old_storage_room_id UUID;
BEGIN
    -- Check if target storage room exists and has capacity
    IF new_storage_room_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM lats_storage_rooms WHERE id = new_storage_room_id) THEN
            RAISE EXCEPTION 'Target storage room does not exist';
        END IF;
        
        -- Check capacity (this is a basic check - you might want more sophisticated logic)
        IF EXISTS (
            SELECT 1 FROM lats_storage_rooms 
            WHERE id = new_storage_room_id 
            AND max_capacity IS NOT NULL 
            AND current_capacity + array_length(product_ids, 1) > max_capacity
        ) THEN
            RAISE EXCEPTION 'Target storage room does not have enough capacity';
        END IF;
    END IF;
    
    -- Move each product
    FOREACH product_id IN ARRAY product_ids
    LOOP
        -- Get current storage room
        SELECT storage_room_id INTO old_storage_room_id 
        FROM lats_products 
        WHERE id = product_id;
        
        -- Update product storage room
        UPDATE lats_products 
        SET storage_room_id = new_storage_room_id 
        WHERE id = product_id;
        
        -- The trigger will handle capacity updates automatically
    END LOOP;
    
    RETURN TRUE;
END;
$$ language 'plpgsql';

-- Create a view for storage room inventory
CREATE OR REPLACE VIEW storage_room_inventory AS
SELECT 
    sr.id as storage_room_id,
    sr.name as storage_room_name,
    sr.code as storage_room_code,
    sr.current_capacity,
    sr.max_capacity,
    p.id as product_id,
    p.name as product_name,
    p.total_quantity,
    p.total_value,
    pv.sku,
    pv.quantity as variant_quantity,
    pv.cost_price,
    pv.selling_price
FROM lats_storage_rooms sr
LEFT JOIN lats_products p ON p.storage_room_id = sr.id
LEFT JOIN lats_product_variants pv ON pv.product_id = p.id
WHERE sr.is_active = true
ORDER BY sr.name, p.name, pv.sku;

-- Grant permissions on the view
GRANT SELECT ON storage_room_inventory TO authenticated;
