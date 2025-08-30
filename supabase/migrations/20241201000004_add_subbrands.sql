-- Migration: 20241201000004_add_subbrands.sql
-- Add subbrands support to lats_brands table

-- Add parent_id column to lats_brands table
ALTER TABLE lats_brands 
ADD COLUMN parent_id UUID REFERENCES lats_brands(id) ON DELETE SET NULL;

-- Add index for better performance on parent_id queries
CREATE INDEX IF NOT EXISTS idx_lats_brands_parent_id ON lats_brands(parent_id);

-- Add is_active column if it doesn't exist
ALTER TABLE lats_brands 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add sort_order column if it doesn't exist
ALTER TABLE lats_brands 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add color column if it doesn't exist
ALTER TABLE lats_brands 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- Add icon column if it doesn't exist
ALTER TABLE lats_brands 
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add metadata column if it doesn't exist
ALTER TABLE lats_brands 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update the unique constraint to allow same names under different parents
-- First drop the existing unique constraint
ALTER TABLE lats_brands DROP CONSTRAINT IF EXISTS lats_brands_name_key;

-- Add a new unique constraint that allows same names under different parents
CREATE UNIQUE INDEX lats_brands_name_parent_unique 
ON lats_brands(name, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Add trigger to prevent circular references
CREATE OR REPLACE FUNCTION check_brand_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a root brand (no parent), allow it
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if the new parent_id would create a circular reference
  -- by checking if any ancestor of the new parent is the current brand
  WITH RECURSIVE brand_tree AS (
    SELECT id, parent_id, 1 as level
    FROM lats_brands 
    WHERE id = NEW.parent_id
    
    UNION ALL
    
    SELECT b.id, b.parent_id, bt.level + 1
    FROM lats_brands b
    INNER JOIN brand_tree bt ON b.id = bt.parent_id
    WHERE bt.level < 10 -- Prevent infinite loops
  )
  SELECT COUNT(*) INTO NEW
  FROM brand_tree 
  WHERE id = NEW.id;
  
  IF FOUND THEN
    RAISE EXCEPTION 'Circular reference detected in brand hierarchy';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insert and update
DROP TRIGGER IF EXISTS check_brand_circular_reference_trigger ON lats_brands;
CREATE TRIGGER check_brand_circular_reference_trigger
  BEFORE INSERT OR UPDATE ON lats_brands
  FOR EACH ROW
  EXECUTE FUNCTION check_brand_circular_reference();

-- Add trigger for updated_at timestamps
CREATE TRIGGER update_lats_brands_updated_at 
BEFORE UPDATE ON lats_brands 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get brand hierarchy
CREATE OR REPLACE FUNCTION get_brand_hierarchy()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo TEXT,
  website TEXT,
  parent_id UUID,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  level INTEGER,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE brand_tree AS (
    -- Root brands (no parent)
    SELECT 
      b.id,
      b.name,
      b.description,
      b.logo,
      b.website,
      b.parent_id,
      b.color,
      b.icon,
      b.is_active,
      b.sort_order,
      b.metadata,
      b.created_at,
      b.updated_at,
      0 as level,
      b.name as path
    FROM lats_brands b
    WHERE b.parent_id IS NULL AND b.is_active = true
    
    UNION ALL
    
    -- Child brands
    SELECT 
      b.id,
      b.name,
      b.description,
      b.logo,
      b.website,
      b.parent_id,
      b.color,
      b.icon,
      b.is_active,
      b.sort_order,
      b.metadata,
      b.created_at,
      b.updated_at,
      bt.level + 1,
      bt.path || ' > ' || b.name
    FROM lats_brands b
    INNER JOIN brand_tree bt ON b.parent_id = bt.id
    WHERE b.is_active = true
  )
  SELECT * FROM brand_tree
  ORDER BY path, sort_order;
END;
$$ LANGUAGE plpgsql;

-- Create function to get root brands
CREATE OR REPLACE FUNCTION get_root_brands()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo TEXT,
  website TEXT,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.logo,
    b.website,
    b.color,
    b.icon,
    b.is_active,
    b.sort_order,
    b.created_at,
    b.updated_at
  FROM lats_brands b
  WHERE b.parent_id IS NULL AND b.is_active = true
  ORDER BY b.sort_order, b.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get subbrands
CREATE OR REPLACE FUNCTION get_subbrands(parent_brand_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo TEXT,
  website TEXT,
  parent_id UUID,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.logo,
    b.website,
    b.parent_id,
    b.color,
    b.icon,
    b.is_active,
    b.sort_order,
    b.created_at,
    b.updated_at
  FROM lats_brands b
  WHERE b.parent_id = parent_brand_id AND b.is_active = true
  ORDER BY b.sort_order, b.name;
END;
$$ LANGUAGE plpgsql;
