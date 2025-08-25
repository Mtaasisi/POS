-- Migration: 20250124060000_add_store_shelf_id_to_products.sql
-- Add store_shelf_id column to products table for shelf assignment

-- Add store_shelf_id column to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS store_shelf_id UUID REFERENCES lats_store_shelves(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_store_shelf 
ON lats_products(store_shelf_id);

-- Add store_shelf_id to RLS policies for lats_products
ALTER POLICY "Allow authenticated users to view products" ON lats_products
USING (auth.role() = 'authenticated');

ALTER POLICY "Allow authenticated users to insert products" ON lats_products
WITH CHECK (auth.role() = 'authenticated');

ALTER POLICY "Allow authenticated users to update products" ON lats_products
USING (auth.role() = 'authenticated');

ALTER POLICY "Allow authenticated users to delete products" ON lats_products
USING (auth.role() = 'authenticated');

-- Create a function to update shelf capacity when products are assigned
CREATE OR REPLACE FUNCTION update_shelf_capacity_on_product_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old shelf capacity (if product was moved from another shelf)
    IF TG_OP = 'UPDATE' AND OLD.store_shelf_id IS DISTINCT FROM NEW.store_shelf_id THEN
        IF OLD.store_shelf_id IS NOT NULL THEN
            UPDATE lats_store_shelves 
            SET current_capacity = GREATEST(0, current_capacity - OLD.stock_quantity)
            WHERE id = OLD.store_shelf_id;
        END IF;
    END IF;
    
    -- Update new shelf capacity
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.store_shelf_id IS DISTINCT FROM NEW.store_shelf_id) THEN
        IF NEW.store_shelf_id IS NOT NULL THEN
            UPDATE lats_store_shelves 
            SET current_capacity = current_capacity + NEW.stock_quantity
            WHERE id = NEW.store_shelf_id;
        END IF;
    END IF;
    
    -- Handle product deletion
    IF TG_OP = 'DELETE' AND OLD.store_shelf_id IS NOT NULL THEN
        UPDATE lats_store_shelves 
        SET current_capacity = GREATEST(0, current_capacity - OLD.stock_quantity)
        WHERE id = OLD.store_shelf_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shelf capacity updates
DROP TRIGGER IF EXISTS update_shelf_capacity_trigger ON lats_products;
CREATE TRIGGER update_shelf_capacity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lats_products
    FOR EACH ROW
    EXECUTE FUNCTION update_shelf_capacity_on_product_change();

-- Create a view for product shelf information
CREATE OR REPLACE VIEW product_shelf_info AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    p.stock_quantity,
    sl.name as store_location_name,
    sl.city as store_location_city,
    sr.name as storage_room_name,
    sr.code as storage_room_code,
    ss.name as shelf_name,
    ss.code as shelf_code,
    ss.is_refrigerated,
    ss.requires_ladder,
    ss.current_capacity as shelf_current_capacity,
    ss.max_capacity as shelf_max_capacity
FROM lats_products p
LEFT JOIN lats_store_locations sl ON p.store_location_id = sl.id
LEFT JOIN lats_storage_rooms sr ON p.storage_room_id = sr.id
LEFT JOIN lats_store_shelves ss ON p.store_shelf_id = ss.id
WHERE p.deleted_at IS NULL;

-- Grant permissions on the view
GRANT SELECT ON product_shelf_info TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN lats_products.store_shelf_id IS 'Reference to the specific shelf where this product is stored';
COMMENT ON VIEW product_shelf_info IS 'View providing comprehensive product storage location information';
