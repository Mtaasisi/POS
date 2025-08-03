-- Setup Spare Part Categories Table
-- Run this script in your Supabase SQL Editor

-- Create spare_part_categories table
CREATE TABLE IF NOT EXISTS spare_part_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT, -- For storing icon names
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_spare_part_categories_name ON spare_part_categories(name);
CREATE INDEX IF NOT EXISTS idx_spare_part_categories_active ON spare_part_categories(is_active);

-- Create trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_spare_part_categories_updated_at ON spare_part_categories;
CREATE TRIGGER update_spare_part_categories_updated_at 
    BEFORE UPDATE ON spare_part_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE spare_part_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view spare part categories" ON spare_part_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert spare part categories" ON spare_part_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update spare part categories" ON spare_part_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete spare part categories" ON spare_part_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON spare_part_categories TO authenticated;

-- Insert default spare part categories
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

-- Add category_id column to spare_parts table
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES spare_part_categories(id);

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_spare_parts_category_id ON spare_parts(category_id);

-- Update existing spare parts to use the new category system
-- This will map the old category values to the new category IDs
UPDATE spare_parts 
SET category_id = (
  SELECT id FROM spare_part_categories 
  WHERE LOWER(name) = LOWER(spare_parts.category)
  LIMIT 1
)
WHERE category_id IS NULL;

-- Add a constraint to ensure category_id is not null for new records
ALTER TABLE spare_parts ALTER COLUMN category_id SET NOT NULL;

-- Drop the old category column (optional - you can keep it for backward compatibility)
-- ALTER TABLE spare_parts DROP COLUMN IF EXISTS category; 