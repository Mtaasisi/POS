-- Migration: 20241201000003_add_subcategories.sql
-- Add subcategories support to lats_categories table

-- Add parent_id column to lats_categories table
ALTER TABLE lats_categories 
ADD COLUMN parent_id UUID REFERENCES lats_categories(id) ON DELETE SET NULL;

-- Add index for better performance on parent_id queries
CREATE INDEX IF NOT EXISTS idx_lats_categories_parent_id ON lats_categories(parent_id);

-- Add is_active column if it doesn't exist
ALTER TABLE lats_categories 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add sort_order column if it doesn't exist
ALTER TABLE lats_categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add icon column if it doesn't exist
ALTER TABLE lats_categories 
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add metadata column if it doesn't exist
ALTER TABLE lats_categories 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update the unique constraint to allow same names under different parents
-- First drop the existing unique constraint
ALTER TABLE lats_categories DROP CONSTRAINT IF EXISTS lats_categories_name_key;

-- Add a new unique constraint that allows same names under different parents
CREATE UNIQUE INDEX lats_categories_name_parent_unique 
ON lats_categories(name, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Add trigger to prevent circular references
CREATE OR REPLACE FUNCTION check_category_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a root category (no parent), allow it
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if the new parent_id would create a circular reference
  -- by checking if any ancestor of the new parent is the current category
  WITH RECURSIVE category_tree AS (
    SELECT id, parent_id, 1 as level
    FROM lats_categories 
    WHERE id = NEW.parent_id
    
    UNION ALL
    
    SELECT c.id, c.parent_id, ct.level + 1
    FROM lats_categories c
    INNER JOIN category_tree ct ON c.id = ct.parent_id
    WHERE ct.level < 10 -- Prevent infinite loops
  )
  SELECT COUNT(*) INTO NEW
  FROM category_tree 
  WHERE id = NEW.id;
  
  IF FOUND THEN
    RAISE EXCEPTION 'Circular reference detected in category hierarchy';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insert and update
DROP TRIGGER IF EXISTS check_category_circular_reference_trigger ON lats_categories;
CREATE TRIGGER check_category_circular_reference_trigger
  BEFORE INSERT OR UPDATE ON lats_categories
  FOR EACH ROW
  EXECUTE FUNCTION check_category_circular_reference();
