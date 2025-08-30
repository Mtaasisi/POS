-- Migration: 20241201000007_add_product_category_relationships.sql
-- Add relationships between products and categories

-- Ensure foreign key constraint exists for category_id in products table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_products_category_id_fkey' 
        AND table_name = 'lats_products'
    ) THEN
        ALTER TABLE lats_products 
        ADD CONSTRAINT lats_products_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES lats_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for category_id in products table for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_category_id ON lats_products(category_id);

-- Add index for active products by category
CREATE INDEX IF NOT EXISTS idx_lats_products_active_category ON lats_products(category_id, is_active) WHERE is_active = true;

-- Create function to get products by category (including subcategories)
CREATE OR REPLACE FUNCTION get_products_by_category_tree(category_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category_id UUID,
    brand_id UUID,
    supplier_id UUID,
    images TEXT[],
    tags TEXT[],
    is_active BOOLEAN,
    total_quantity INTEGER,
    total_value DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    category_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Start with the specified category
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            0 as level,
            c.name as path
        FROM lats_categories c
        WHERE c.id = category_id AND c.is_active = true
        
        UNION ALL
        
        -- Get all descendants
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            ct.level + 1,
            ct.path || ' > ' || c.name
        FROM lats_categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
    )
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.brand_id,
        p.supplier_id,
        p.images,
        p.tags,
        p.is_active,
        p.total_quantity,
        p.total_value,
        p.created_at,
        p.updated_at,
        ct.path as category_path
    FROM lats_products p
    INNER JOIN category_tree ct ON p.category_id = ct.id
    WHERE p.is_active = true
    ORDER BY ct.path, p.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get category statistics
CREATE OR REPLACE FUNCTION get_category_statistics()
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_path TEXT,
    product_count INTEGER,
    total_value DECIMAL,
    active_products INTEGER,
    low_stock_products INTEGER,
    out_of_stock_products INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Root categories
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            0 as level,
            c.name as path
        FROM lats_categories c
        WHERE c.parent_id IS NULL AND c.is_active = true
        
        UNION ALL
        
        -- Child categories
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            ct.level + 1,
            ct.path || ' > ' || c.name
        FROM lats_categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
    )
    SELECT 
        ct.id as category_id,
        ct.name as category_name,
        ct.path as category_path,
        COUNT(p.id) as product_count,
        COALESCE(SUM(p.total_value), 0) as total_value,
        COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products,
        COUNT(CASE WHEN p.total_quantity > 0 AND p.total_quantity <= 10 THEN 1 END) as low_stock_products,
        COUNT(CASE WHEN p.total_quantity = 0 THEN 1 END) as out_of_stock_products
    FROM category_tree ct
    LEFT JOIN lats_products p ON ct.id = p.category_id
    GROUP BY ct.id, ct.name, ct.path
    ORDER BY ct.path;
END;
$$ LANGUAGE plpgsql;

-- Create function to move products to a new category
CREATE OR REPLACE FUNCTION move_products_to_category(
    old_category_id UUID,
    new_category_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    moved_count INTEGER := 0;
BEGIN
    -- Validate that new category exists and is active
    IF NOT EXISTS (SELECT 1 FROM lats_categories WHERE id = new_category_id AND is_active = true) THEN
        RAISE EXCEPTION 'Target category does not exist or is not active';
    END IF;
    
    -- Move products
    UPDATE lats_products
    SET category_id = new_category_id,
        updated_at = NOW()
    WHERE category_id = old_category_id;
    
    GET DIAGNOSTICS moved_count = ROW_COUNT;
    
    RETURN moved_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get category breadcrumb
CREATE OR REPLACE FUNCTION get_category_breadcrumb(category_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    level INTEGER,
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE breadcrumb AS (
        -- Start with the current category
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            0 as level,
            true as is_current
        FROM lats_categories c
        WHERE c.id = category_id
        
        UNION ALL
        
        -- Get all ancestors
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            b.level + 1,
            false as is_current
        FROM lats_categories c
        INNER JOIN breadcrumb b ON c.id = b.parent_id
    )
    SELECT 
        id,
        name,
        level,
        is_current
    FROM breadcrumb
    ORDER BY level DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for category product summary
CREATE OR REPLACE VIEW category_product_summary AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.parent_id,
    c.color,
    c.icon,
    c.is_active as category_active,
    COUNT(p.id) as total_products,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products,
    COUNT(CASE WHEN p.is_active = false THEN 1 END) as inactive_products,
    COALESCE(SUM(p.total_quantity), 0) as total_stock,
    COALESCE(SUM(p.total_value), 0) as total_value,
    COUNT(CASE WHEN p.total_quantity = 0 THEN 1 END) as out_of_stock,
    COUNT(CASE WHEN p.total_quantity > 0 AND p.total_quantity <= 10 THEN 1 END) as low_stock
FROM lats_categories c
LEFT JOIN lats_products p ON c.id = p.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.parent_id, c.color, c.icon, c.is_active
ORDER BY c.name;

-- Add check constraint to ensure product category exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_product_category_exists' 
        AND table_name = 'lats_products'
    ) THEN
        ALTER TABLE lats_products 
        ADD CONSTRAINT check_product_category_exists 
        CHECK (category_id IS NULL OR EXISTS (
            SELECT 1 FROM lats_categories 
            WHERE id = category_id AND is_active = true
        ));
    END IF;
END $$;

-- Create trigger to validate category when inserting/updating products
CREATE OR REPLACE FUNCTION validate_product_category()
RETURNS TRIGGER AS $$
BEGIN
    -- If category_id is provided, ensure it exists and is active
    IF NEW.category_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM lats_categories 
            WHERE id = NEW.category_id AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Category does not exist or is not active';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product category validation
DROP TRIGGER IF EXISTS validate_product_category_trigger ON lats_products;
CREATE TRIGGER validate_product_category_trigger
    BEFORE INSERT OR UPDATE ON lats_products
    FOR EACH ROW
    EXECUTE FUNCTION validate_product_category();

-- Add comments to document the relationships
COMMENT ON FUNCTION get_products_by_category_tree(UUID) IS 'Get all products in a category and its subcategories';
COMMENT ON FUNCTION get_category_statistics() IS 'Get statistics for all categories including product counts and values';
COMMENT ON FUNCTION move_products_to_category(UUID, UUID) IS 'Move all products from one category to another';
COMMENT ON FUNCTION get_category_breadcrumb(UUID) IS 'Get the breadcrumb path for a category (root to current)';
COMMENT ON VIEW category_product_summary IS 'Summary view of categories with their product statistics';

-- Add RLS policies for product-category relationships
-- Policy to allow users to view products by category
CREATE POLICY "Users can view products by category" 
ON lats_products FOR SELECT 
USING (true);

-- Policy to allow users to update product categories
CREATE POLICY "Users can update product categories" 
ON lats_products FOR UPDATE 
USING (true);

-- Policy to allow users to insert products with categories
CREATE POLICY "Users can create products with categories" 
ON lats_products FOR INSERT 
WITH CHECK (true);
