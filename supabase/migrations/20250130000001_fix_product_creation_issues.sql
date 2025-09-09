-- Migration: Fix product creation issues
-- This migration fixes multiple issues that could cause product creation to fail

-- 1. Fix the broken view that references removed brands table
DROP VIEW IF EXISTS product_comprehensive_info;

-- Recreate the view without the brand reference and removed barcode column
CREATE OR REPLACE VIEW product_comprehensive_info AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.specification,
    p.sku,
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
    s.name as supplier_name,
    sr.name as storage_room_name,
    ss.name as shelf_name,
    p.created_at,
    p.updated_at
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
LEFT JOIN lats_suppliers s ON p.supplier_id = s.id
LEFT JOIN lats_storage_rooms sr ON p.storage_room_id = sr.id
LEFT JOIN lats_store_shelves ss ON p.store_shelf_id = ss.id;

-- Grant permissions on the view
GRANT SELECT ON product_comprehensive_info TO authenticated;

-- 2. Clean up conflicting RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lats_products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON lats_products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON lats_products;
DROP POLICY IF EXISTS "Allow authenticated users to view products" ON lats_products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON lats_products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON lats_products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON lats_products;
DROP POLICY IF EXISTS "Allow all operations on products" ON lats_products;
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON lats_products;
DROP POLICY IF EXISTS "Enable all access for all users on lats_products" ON lats_products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_products" ON lats_products;

-- 3. Create clean, simple RLS policies
CREATE POLICY "Enable read access for all users" ON lats_products
  FOR SELECT USING (true);
  
CREATE POLICY "Enable insert for authenticated users" ON lats_products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY "Enable update for authenticated users" ON lats_products
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY "Enable delete for authenticated users" ON lats_products
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Ensure all required columns have proper defaults
ALTER TABLE lats_products 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN is_active SET DEFAULT true,
ALTER COLUMN total_quantity SET DEFAULT 0,
ALTER COLUMN total_value SET DEFAULT 0;

-- 5. Add comments for documentation
COMMENT ON VIEW product_comprehensive_info IS 'Comprehensive product information view - fixed to remove brand references';
COMMENT ON TABLE lats_products IS 'LATS Products table - cleaned up RLS policies and constraints';

-- 6. Create a function to safely create products with proper error handling
CREATE OR REPLACE FUNCTION safe_create_product(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_specification TEXT DEFAULT NULL,
    p_sku TEXT DEFAULT NULL,
    p_cost_price DECIMAL(10,2) DEFAULT 0,
    p_selling_price DECIMAL(10,2) DEFAULT 0,
    p_stock_quantity INTEGER DEFAULT 0,
    p_min_stock_level INTEGER DEFAULT 0,
    p_condition TEXT DEFAULT 'new',
    p_category_id UUID DEFAULT NULL,
    p_supplier_id UUID DEFAULT NULL,
    p_storage_room_id UUID DEFAULT NULL,
    p_store_shelf_id UUID DEFAULT NULL,
    p_attributes JSONB DEFAULT '{}',
    p_metadata JSONB DEFAULT '{}',
    p_images TEXT[] DEFAULT '{}',
    p_tags TEXT[] DEFAULT '{}'
) RETURNS TABLE(
    success BOOLEAN,
    product_id UUID,
    error_message TEXT
) AS $$
DECLARE
    new_product_id UUID;
    error_msg TEXT;
BEGIN
    BEGIN
        -- Insert the product
        INSERT INTO lats_products (
            name, description, specification, sku,
            cost_price, selling_price, stock_quantity, min_stock_level,
            condition, category_id, supplier_id, storage_room_id, store_shelf_id,
            attributes, metadata, images, tags, is_active, total_quantity, total_value
        ) VALUES (
            p_name, p_description, p_specification, p_sku,
            p_cost_price, p_selling_price, p_stock_quantity, p_min_stock_level,
            p_condition, p_category_id, p_supplier_id, p_storage_room_id, p_store_shelf_id,
            p_attributes, p_metadata, p_images, p_tags, true, p_stock_quantity, (p_stock_quantity * p_cost_price)
        ) RETURNING id INTO new_product_id;
        
        -- Return success
        RETURN QUERY SELECT true, new_product_id, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- Return error
        error_msg := SQLERRM;
        RETURN QUERY SELECT false, NULL::UUID, error_msg;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION safe_create_product TO authenticated;

-- Add comment for the function
COMMENT ON FUNCTION safe_create_product IS 'Safely creates a product with proper error handling and returns success status';