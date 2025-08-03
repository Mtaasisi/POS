-- Fix Spare Part Categories - Run this to resolve the null values issue

-- First, let's check what categories exist in spare_parts
SELECT DISTINCT category FROM spare_parts WHERE category IS NOT NULL;

-- Create the spare_part_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS spare_part_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO spare_part_categories (name, description, color, icon) VALUES
('Screen', 'Display screens and LCD panels', '#3B82F6', 'smartphone'),
('Battery', 'Rechargeable batteries and power cells', '#10B981', 'battery'),
('Camera', 'Camera modules and lenses', '#8B5CF6', 'camera'),
('Speaker', 'Audio speakers and sound components', '#F59E0B', 'speaker'),
('Microphone', 'Microphone components', '#EF4444', 'mic'),
('Charging Port', 'USB ports and charging connectors', '#6366F1', 'zap'),
('Motherboard', 'Main circuit boards and PCBs', '#14B8A6', 'cpu'),
('Other', 'Miscellaneous spare parts', '#6B7280', 'package')
ON CONFLICT (name) DO NOTHING;

-- Add category_id column if it doesn't exist
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES spare_part_categories(id);

-- Update existing spare parts to map old categories to new category IDs
UPDATE spare_parts 
SET category_id = (
  SELECT id FROM spare_part_categories 
  WHERE LOWER(name) = LOWER(spare_parts.category)
  LIMIT 1
)
WHERE category_id IS NULL AND category IS NOT NULL;

-- For any remaining null category_id values, set them to 'Other'
UPDATE spare_parts 
SET category_id = (
  SELECT id FROM spare_part_categories 
  WHERE name = 'Other'
  LIMIT 1
)
WHERE category_id IS NULL;

-- Now we can safely make category_id NOT NULL
ALTER TABLE spare_parts ALTER COLUMN category_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_spare_parts_category_id ON spare_parts(category_id);

-- Verify the migration worked
SELECT 
  sp.name as spare_part_name,
  sp.category as old_category,
  spc.name as new_category_name
FROM spare_parts sp
LEFT JOIN spare_part_categories spc ON sp.category_id = spc.id
LIMIT 10; 