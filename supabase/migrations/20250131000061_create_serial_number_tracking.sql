-- Create Serial Number Tracking System
-- Migration: 20250131000061_create_serial_number_tracking.sql

-- Create inventory_items table for individual item tracking
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    serial_number VARCHAR(255) NOT NULL,
    imei VARCHAR(20), -- For mobile devices
    mac_address VARCHAR(17), -- For network devices
    barcode VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'returned', 'repair', 'warranty')),
    location VARCHAR(100), -- Physical location
    shelf VARCHAR(50),
    bin VARCHAR(50),
    purchase_date DATE,
    warranty_start DATE,
    warranty_end DATE,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    notes TEXT,
    metadata JSONB DEFAULT '{}', -- Additional device-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth_users(id)
);

-- Create unique constraint on serial number per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_serial_product 
ON inventory_items(product_id, serial_number);

-- Create unique constraint on IMEI
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_imei 
ON inventory_items(imei) WHERE imei IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_variant_id ON inventory_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_serial_number ON inventory_items(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(location);
CREATE INDEX IF NOT EXISTS idx_inventory_items_created_at ON inventory_items(created_at);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON inventory_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON inventory_items FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_inventory_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_items_updated_at();

-- Create serial number movements table for tracking
CREATE TABLE IF NOT EXISTS serial_number_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('received', 'sold', 'returned', 'damaged', 'repair', 'warranty', 'location_change')),
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    reference_id UUID, -- Links to sale, purchase order, etc.
    reference_type VARCHAR(50), -- 'sale', 'purchase_order', 'repair', etc.
    notes TEXT,
    created_by UUID REFERENCES auth_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for serial number movements
CREATE INDEX IF NOT EXISTS idx_serial_movements_item_id ON serial_number_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_serial_movements_type ON serial_number_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_serial_movements_reference ON serial_number_movements(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_serial_movements_created_at ON serial_number_movements(created_at);

-- Enable RLS for serial number movements
ALTER TABLE serial_number_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for serial number movements
CREATE POLICY "Enable read access for all users" ON serial_number_movements FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON serial_number_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON serial_number_movements FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON serial_number_movements FOR DELETE USING (true);

-- Create function to generate serial numbers
CREATE OR REPLACE FUNCTION generate_serial_numbers(
    product_id_param UUID,
    quantity_param INTEGER,
    prefix_param VARCHAR(50) DEFAULT NULL
) RETURNS TABLE(serial_number VARCHAR(255)) AS $$
DECLARE
    product_sku VARCHAR(100);
    base_serial VARCHAR(255);
    i INTEGER;
BEGIN
    -- Get product SKU
    SELECT sku INTO product_sku FROM lats_products WHERE id = product_id_param;
    
    -- Create base serial number
    IF prefix_param IS NOT NULL THEN
        base_serial := prefix_param || '-' || COALESCE(product_sku, 'ITEM');
    ELSE
        base_serial := COALESCE(product_sku, 'ITEM');
    END IF;
    
    -- Generate serial numbers
    FOR i IN 1..quantity_param LOOP
        serial_number := base_serial || '-' || LPAD(i::TEXT, 4, '0');
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate serial number uniqueness
CREATE OR REPLACE FUNCTION is_serial_number_unique(
    product_id_param UUID,
    serial_number_param VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM inventory_items 
        WHERE product_id = product_id_param 
        AND serial_number = serial_number_param
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get available serial numbers for a product
CREATE OR REPLACE FUNCTION get_available_serial_numbers(
    product_id_param UUID,
    limit_param INTEGER DEFAULT 10
) RETURNS TABLE(
    id UUID,
    serial_number VARCHAR(255),
    imei VARCHAR(20),
    location VARCHAR(100),
    cost_price DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ii.id,
        ii.serial_number,
        ii.imei,
        ii.location,
        ii.cost_price
    FROM inventory_items ii
    WHERE ii.product_id = product_id_param
    AND ii.status = 'available'
    ORDER BY ii.created_at
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO inventory_items (
    product_id,
    serial_number,
    status,
    location,
    cost_price,
    selling_price
) VALUES (
    (SELECT id FROM lats_products LIMIT 1),
    'TEST-001',
    'available',
    'Main Store',
    100.00,
    150.00
) ON CONFLICT DO NOTHING;

