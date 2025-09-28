-- Clean Migration for Items and Received Tabs
-- Run this in Supabase SQL Editor

-- Create lats_purchase_order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS lats_purchase_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    serial_number VARCHAR(255) NOT NULL,
    imei VARCHAR(20),
    mac_address VARCHAR(17),
    barcode VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'returned', 'repair', 'warranty')),
    location VARCHAR(100),
    shelf VARCHAR(50),
    bin VARCHAR(50),
    purchase_date DATE,
    warranty_start DATE,
    warranty_end DATE,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth_users(id)
);

-- Add missing columns to lats_inventory_adjustments if they don't exist
ALTER TABLE lats_inventory_adjustments 
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON lats_purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON lats_purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_serial_number ON inventory_items(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_items_metadata ON inventory_items USING GIN (metadata);

-- Enable RLS
ALTER TABLE lats_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop first if they exist)
DROP POLICY IF EXISTS "Enable all access for lats_purchase_order_items" ON lats_purchase_order_items;
CREATE POLICY "Enable all access for lats_purchase_order_items" ON lats_purchase_order_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for inventory_items" ON inventory_items;
CREATE POLICY "Enable all access for inventory_items" ON inventory_items FOR ALL USING (true);

-- Drop existing function if it exists (to handle return type changes)
DROP FUNCTION IF EXISTS get_purchase_order_items_with_products(UUID);

-- Create helper function for purchase order items
CREATE OR REPLACE FUNCTION get_purchase_order_items_with_products(po_id UUID)
RETURNS TABLE (
    id UUID,
    purchase_order_id UUID,
    product_id UUID,
    variant_id UUID,
    quantity INTEGER,
    cost_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    received_quantity INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    product_name TEXT,
    product_sku TEXT,
    variant_name TEXT,
    variant_sku TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        poi.id,
        poi.purchase_order_id,
        poi.product_id,
        poi.variant_id,
        poi.quantity,
        poi.cost_price,
        poi.total_price,
        poi.received_quantity,
        poi.notes,
        poi.created_at,
        poi.updated_at,
        p.name as product_name,
        p.sku as product_sku,
        pv.name as variant_name,
        pv.sku as variant_sku
    FROM lats_purchase_order_items poi
    LEFT JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    WHERE poi.purchase_order_id = po_id
    ORDER BY poi.created_at;
END;
$$ LANGUAGE plpgsql;

-- Create helper function for received items
CREATE OR REPLACE FUNCTION get_received_items_for_po(po_id UUID)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    variant_id UUID,
    serial_number VARCHAR(255),
    imei VARCHAR(20),
    mac_address VARCHAR(17),
    barcode VARCHAR(100),
    status VARCHAR(20),
    location VARCHAR(100),
    shelf VARCHAR(50),
    bin VARCHAR(50),
    purchase_date DATE,
    warranty_start DATE,
    warranty_end DATE,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    product_name TEXT,
    product_sku TEXT,
    variant_name TEXT,
    variant_sku TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ii.id,
        ii.product_id,
        ii.variant_id,
        ii.serial_number,
        ii.imei,
        ii.mac_address,
        ii.barcode,
        ii.status,
        ii.location,
        ii.shelf,
        ii.bin,
        ii.purchase_date,
        ii.warranty_start,
        ii.warranty_end,
        ii.cost_price,
        ii.selling_price,
        ii.notes,
        ii.created_at,
        p.name as product_name,
        p.sku as product_sku,
        pv.name as variant_name,
        pv.sku as variant_sku
    FROM inventory_items ii
    LEFT JOIN lats_products p ON ii.product_id = p.id
    LEFT JOIN lats_product_variants pv ON ii.variant_id = pv.id
    WHERE ii.metadata->>'purchase_order_id' = po_id::TEXT
    ORDER BY ii.created_at DESC;
END;
$$ LANGUAGE plpgsql;
