-- Migration: 20241201000006_enhance_category_relationships.sql
-- Enhance category relationships and add additional constraints

-- Add cascade delete option for parent_id (optional - uncomment if you want cascade delete)
-- ALTER TABLE lats_categories DROP CONSTRAINT IF EXISTS lats_categories_parent_id_fkey;
-- ALTER TABLE lats_categories ADD CONSTRAINT lats_categories_parent_id_fkey 
--   FOREIGN KEY (parent_id) REFERENCES lats_categories(id) ON DELETE CASCADE;

-- Add check constraint to prevent self-reference
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_category_not_self_parent' 
        AND table_name = 'lats_categories'
    ) THEN
        ALTER TABLE lats_categories 
        ADD CONSTRAINT check_category_not_self_parent 
        CHECK (parent_id IS NULL OR parent_id != id);
    END IF;
END $$;

-- Add check constraint for sort_order
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_sort_order_positive' 
        AND table_name = 'lats_categories'
    ) THEN
        ALTER TABLE lats_categories 
        ADD CONSTRAINT check_sort_order_positive 
        CHECK (sort_order >= 0);
    END IF;
END $$;

-- Add check constraint for color format
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_color_format' 
        AND table_name = 'lats_categories'
    ) THEN
        ALTER TABLE lats_categories 
        ADD CONSTRAINT check_color_format 
        CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END $$;

-- Add index for active categories
CREATE INDEX IF NOT EXISTS idx_lats_categories_active ON lats_categories(is_active) WHERE is_active = true;

-- Add index for sort order
CREATE INDEX IF NOT EXISTS idx_lats_categories_sort_order ON lats_categories(sort_order);

-- Add composite index for parent and sort order
CREATE INDEX IF NOT EXISTS idx_lats_categories_parent_sort ON lats_categories(parent_id, sort_order) WHERE parent_id IS NOT NULL;

-- Add index for root categories (no parent)
CREATE INDEX IF NOT EXISTS idx_lats_categories_root ON lats_categories(id) WHERE parent_id IS NULL;

-- Create function to get category depth
CREATE OR REPLACE FUNCTION get_category_depth(category_id UUID)
RETURNS INTEGER AS $$
DECLARE
    depth INTEGER := 0;
    current_parent UUID;
BEGIN
    SELECT parent_id INTO current_parent 
    FROM lats_categories 
    WHERE id = category_id;
    
    WHILE current_parent IS NOT NULL LOOP
        depth := depth + 1;
        SELECT parent_id INTO current_parent 
        FROM lats_categories 
        WHERE id = current_parent;
        
        -- Prevent infinite loops
        IF depth > 10 THEN
            RAISE EXCEPTION 'Category hierarchy too deep (max 10 levels)';
        END IF;
    END LOOP;
    
    RETURN depth;
END;
$$ LANGUAGE plpgsql;

-- Create function to get category path
CREATE OR REPLACE FUNCTION get_category_path(category_id UUID)
RETURNS TEXT AS $$
DECLARE
    path TEXT := '';
    current_id UUID := category_id;
    current_name TEXT;
BEGIN
    WHILE current_id IS NOT NULL LOOP
        SELECT name, parent_id INTO current_name, current_id
        FROM lats_categories 
        WHERE id = current_id;
        
        IF path = '' THEN
            path := current_name;
        ELSE
            path := current_name || ' > ' || path;
        END IF;
    END LOOP;
    
    RETURN path;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all descendants of a category
CREATE OR REPLACE FUNCTION get_category_descendants(root_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    parent_id UUID,
    color TEXT,
    icon TEXT,
    is_active BOOLEAN,
    sort_order INTEGER,
    depth INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Root category
        SELECT 
            c.id,
            c.name,
            c.description,
            c.parent_id,
            c.color,
            c.icon,
            c.is_active,
            c.sort_order,
            0 as depth,
            c.name as path
        FROM lats_categories c
        WHERE c.id = root_id
        
        UNION ALL
        
        -- Child categories
        SELECT 
            c.id,
            c.name,
            c.description,
            c.parent_id,
            c.color,
            c.icon,
            c.is_active,
            c.sort_order,
            ct.depth + 1,
            ct.path || ' > ' || c.name
        FROM lats_categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
    )
    SELECT * FROM category_tree
    ORDER BY path, sort_order;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all ancestors of a category
CREATE OR REPLACE FUNCTION get_category_ancestors(category_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    parent_id UUID,
    color TEXT,
    icon TEXT,
    is_active BOOLEAN,
    sort_order INTEGER,
    depth INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_ancestors AS (
        -- Start with the category itself
        SELECT 
            c.id,
            c.name,
            c.description,
            c.parent_id,
            c.color,
            c.icon,
            c.is_active,
            c.sort_order,
            0 as depth
        FROM lats_categories c
        WHERE c.id = category_id
        
        UNION ALL
        
        -- Parent categories
        SELECT 
            c.id,
            c.name,
            c.description,
            c.parent_id,
            c.color,
            c.icon,
            c.is_active,
            c.sort_order,
            ca.depth + 1
        FROM lats_categories c
        INNER JOIN category_ancestors ca ON c.id = ca.parent_id
        WHERE c.is_active = true
    )
    SELECT * FROM category_ancestors
    ORDER BY depth DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to move category and its descendants
CREATE OR REPLACE FUNCTION move_category_tree(
    category_id UUID,
    new_parent_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    old_parent_id UUID;
    descendants_count INTEGER;
BEGIN
    -- Get current parent
    SELECT parent_id INTO old_parent_id
    FROM lats_categories
    WHERE id = category_id;
    
    -- Check if move is valid (not moving to itself or its descendant)
    IF new_parent_id = category_id THEN
        RAISE EXCEPTION 'Cannot move category to itself';
    END IF;
    
    -- Check if new parent is a descendant
    SELECT COUNT(*) INTO descendants_count
    FROM get_category_descendants(category_id)
    WHERE id = new_parent_id;
    
    IF descendants_count > 0 THEN
        RAISE EXCEPTION 'Cannot move category to its descendant';
    END IF;
    
    -- Update the category's parent
    UPDATE lats_categories
    SET parent_id = new_parent_id,
        updated_at = NOW()
    WHERE id = category_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to delete category and its descendants
CREATE OR REPLACE FUNCTION delete_category_tree(category_id UUID)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete all descendants first
    WITH RECURSIVE category_tree AS (
        SELECT id FROM lats_categories WHERE id = category_id
        UNION ALL
        SELECT c.id FROM lats_categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    DELETE FROM lats_categories
    WHERE id IN (SELECT id FROM category_tree);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for category hierarchy
CREATE OR REPLACE VIEW category_hierarchy_view AS
WITH RECURSIVE category_tree AS (
    -- Root categories
    SELECT 
        id,
        name,
        description,
        parent_id,
        color,
        icon,
        is_active,
        sort_order,
        0 as level,
        name as path,
        ARRAY[id] as path_ids
    FROM lats_categories 
    WHERE parent_id IS NULL AND is_active = true
    
    UNION ALL
    
    -- Child categories
    SELECT 
        c.id,
        c.name,
        c.description,
        c.parent_id,
        c.color,
        c.icon,
        c.is_active,
        c.sort_order,
        ct.level + 1,
        ct.path || ' > ' || c.name,
        ct.path_ids || c.id
    FROM lats_categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.is_active = true
)
SELECT 
    id,
    name,
    description,
    parent_id,
    color,
    icon,
    is_active,
    sort_order,
    level,
    path,
    path_ids,
    level + 1 as depth
FROM category_tree
ORDER BY path, sort_order;

-- Add RLS policies for category relationships
-- Policy to allow users to view categories they have access to
CREATE POLICY "Users can view category hierarchy" 
ON lats_categories FOR SELECT 
USING (true);

-- Policy to allow users to insert categories
CREATE POLICY "Users can create categories" 
ON lats_categories FOR INSERT 
WITH CHECK (true);

-- Policy to allow users to update categories
CREATE POLICY "Users can update categories" 
ON lats_categories FOR UPDATE 
USING (true);

-- Policy to allow users to delete categories
CREATE POLICY "Users can delete categories" 
ON lats_categories FOR DELETE 
USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_category_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_lats_categories_updated_at ON lats_categories;
CREATE TRIGGER update_lats_categories_updated_at
    BEFORE UPDATE ON lats_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_updated_at();

-- Add comments to document the relationships
COMMENT ON TABLE lats_categories IS 'Categories table with hierarchical structure support';
COMMENT ON COLUMN lats_categories.parent_id IS 'Reference to parent category. NULL for root categories';
COMMENT ON COLUMN lats_categories.is_active IS 'Whether the category is active and visible';
COMMENT ON COLUMN lats_categories.sort_order IS 'Order for display (lower numbers first)';
COMMENT ON COLUMN lats_categories.color IS 'Hex color code for category display';
COMMENT ON COLUMN lats_categories.icon IS 'Icon name for category display';
COMMENT ON COLUMN lats_categories.metadata IS 'Additional metadata as JSON';

COMMENT ON FUNCTION get_category_depth(UUID) IS 'Get the depth level of a category in the hierarchy';
COMMENT ON FUNCTION get_category_path(UUID) IS 'Get the full path of a category (e.g., "Electronics > Mobile Phones > Android")';
COMMENT ON FUNCTION get_category_descendants(UUID) IS 'Get all descendants of a category in hierarchical order';
COMMENT ON FUNCTION get_category_ancestors(UUID) IS 'Get all ancestors of a category from root to leaf';
COMMENT ON FUNCTION move_category_tree(UUID, UUID) IS 'Move a category and validate the move operation';
COMMENT ON FUNCTION delete_category_tree(UUID) IS 'Delete a category and all its descendants';
