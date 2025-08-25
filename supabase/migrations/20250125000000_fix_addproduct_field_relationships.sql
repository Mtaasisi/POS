-- Migration: Fix AddProduct field relationships
-- This migration adds all missing fields that the AddProduct page collects but doesn't save

-- Add missing fields to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS specification TEXT,
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_room_id UUID REFERENCES lats_storage_rooms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS store_shelf_id UUID REFERENCES lats_store_shelves(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_sku ON lats_products(sku);
CREATE INDEX IF NOT EXISTS idx_lats_products_barcode ON lats_products(barcode);
CREATE INDEX IF NOT EXISTS idx_lats_products_specification ON lats_products USING gin(to_tsvector('english', specification));
CREATE INDEX IF NOT EXISTS idx_lats_products_storage_room ON lats_products(storage_room_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_store_shelf ON lats_products(store_shelf_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_condition ON lats_products(condition);
CREATE INDEX IF NOT EXISTS idx_lats_products_attributes ON lats_products USING gin(attributes);
CREATE INDEX IF NOT EXISTS idx_lats_products_metadata ON lats_products USING gin(metadata);

-- Update existing products to have default values for new columns
UPDATE lats_products 
SET 
  cost_price = COALESCE(cost_price, 0),
  selling_price = COALESCE(selling_price, 0),
  stock_quantity = COALESCE(stock_quantity, 0),
  min_stock_level = COALESCE(min_stock_level, 0),
  condition = COALESCE(condition, 'new'),
  attributes = COALESCE(attributes, '{}'),
  metadata = COALESCE(metadata, '{}')
WHERE cost_price IS NULL 
   OR selling_price IS NULL 
   OR stock_quantity IS NULL 
   OR min_stock_level IS NULL 
   OR condition IS NULL 
   OR attributes IS NULL 
   OR metadata IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN lats_products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN lats_products.barcode IS 'Product barcode for scanning';
COMMENT ON COLUMN lats_products.specification IS 'Product specifications and technical details';
COMMENT ON COLUMN lats_products.cost_price IS 'Product cost price';
COMMENT ON COLUMN lats_products.selling_price IS 'Product selling price';
COMMENT ON COLUMN lats_products.stock_quantity IS 'Current stock quantity';
COMMENT ON COLUMN lats_products.min_stock_level IS 'Minimum stock level for alerts';
COMMENT ON COLUMN lats_products.storage_room_id IS 'Reference to storage room where product is stored';
COMMENT ON COLUMN lats_products.store_shelf_id IS 'Reference to specific shelf where product is stored';
COMMENT ON COLUMN lats_products.condition IS 'Product condition (new, used, refurbished)';
COMMENT ON COLUMN lats_products.attributes IS 'Product attributes and specifications stored as JSONB';
COMMENT ON COLUMN lats_products.metadata IS 'Additional product metadata stored as JSONB';

-- Update RLS policies to ensure all columns are accessible
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON lats_products;

CREATE POLICY "Enable read access for all users" ON lats_products
  FOR SELECT USING (true);
  
CREATE POLICY "Enable insert for authenticated users only" ON lats_products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY "Enable update for authenticated users only" ON lats_products
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY "Enable delete for authenticated users only" ON lats_products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create a function to update product totals when variants change
CREATE OR REPLACE FUNCTION update_product_totals_from_variants()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product totals when variants are inserted, updated, or deleted
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
$$ LANGUAGE plpgsql;

-- Create trigger for updating product totals
DROP TRIGGER IF EXISTS update_product_totals_trigger ON lats_product_variants;
CREATE TRIGGER update_product_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lats_product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_product_totals_from_variants();

-- Create a view for comprehensive product information
CREATE OR REPLACE VIEW product_comprehensive_info AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.specification,
    p.sku,
    p.barcode,
    p.cost_price,
    p.selling_price,
    p.stock_quantity,
    p.min_stock_level,
    p.condition,
    p.attributes,
    p.metadata,
    p.images,
    p.tags,
    p.is_active,
    p.total_quantity,
    p.total_value,
    c.name as category_name,
    b.name as brand_name,
    s.name as supplier_name,
    sr.name as storage_room_name,
    ss.name as shelf_name,
    p.created_at,
    p.updated_at
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
LEFT JOIN lats_brands b ON p.brand_id = b.id
LEFT JOIN lats_suppliers s ON p.supplier_id = s.id
LEFT JOIN lats_storage_rooms sr ON p.storage_room_id = sr.id
LEFT JOIN lats_store_shelves ss ON p.store_shelf_id = ss.id;

-- Grant permissions on the view
GRANT SELECT ON product_comprehensive_info TO authenticated;
