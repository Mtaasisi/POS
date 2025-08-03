-- Fix inventory_products table structure to match TypeScript types
-- The application expects category_id instead of category

-- First, create the inventory_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id column to inventory_products
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES inventory_categories(id);

-- Create index for category_id
CREATE INDEX IF NOT EXISTS idx_inventory_products_category_id ON inventory_products(category_id);

-- Enable RLS on inventory_categories
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_categories
CREATE POLICY "Users can view inventory categories" ON inventory_categories FOR SELECT USING (true);
CREATE POLICY "Users can insert inventory categories" ON inventory_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update inventory categories" ON inventory_categories FOR UPDATE USING (true);
CREATE POLICY "Users can delete inventory categories" ON inventory_categories FOR DELETE USING (true);

-- Create trigger for inventory_categories updated_at
CREATE TRIGGER update_inventory_categories_updated_at 
    BEFORE UPDATE ON inventory_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default categories
INSERT INTO inventory_categories (name, description) VALUES
('Screens', 'Device screens and displays'),
('Batteries', 'Device batteries and power supplies'),
('Cameras', 'Camera modules and components'),
('Speakers', 'Audio speakers and components'),
('Charging Ports', 'Charging ports and connectors'),
('Motherboards', 'Device motherboards and main boards'),
('Accessories', 'Device accessories and peripherals'),
('Tools', 'Repair tools and equipment'),
('Other', 'Miscellaneous parts and components')
ON CONFLICT DO NOTHING;

-- Verify the changes
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'inventory_products'
    AND column_name IN ('category', 'category_id')
ORDER BY column_name; 