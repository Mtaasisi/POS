-- Create Sale Inventory Items Table (Safe Version)
-- This table links sales to specific serialized inventory items
-- Handles existing policies gracefully

-- Create sale_inventory_items table for tracking which specific items were sold
CREATE TABLE IF NOT EXISTS sale_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_inventory_items_unique 
ON sale_inventory_items(sale_id, inventory_item_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sale_inventory_items_sale_id ON sale_inventory_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_inventory_items_inventory_item_id ON sale_inventory_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_sale_inventory_items_customer_id ON sale_inventory_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_inventory_items_created_at ON sale_inventory_items(created_at);

-- Enable RLS (safe to run multiple times)
ALTER TABLE sale_inventory_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Enable read access for all users" ON sale_inventory_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON sale_inventory_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON sale_inventory_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON sale_inventory_items;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON sale_inventory_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON sale_inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON sale_inventory_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON sale_inventory_items FOR DELETE USING (true);
