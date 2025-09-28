-- =====================================================
-- MIGRATION: Items and Received Tabs Functionality
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to migrate
-- the items and received tabs functionality

-- =====================================================
-- ENSURE PURCHASE ORDER ITEMS TABLE IS PROPERLY SET UP
-- =====================================================

-- Make sure the lats_purchase_order_items table has all required columns
DO $$
BEGIN
    -- Check if the table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_purchase_order_items') THEN
        CREATE TABLE lats_purchase_order_items (
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
        RAISE NOTICE 'Created lats_purchase_order_items table';
    END IF;
END $$;

-- Add any missing columns to existing table
DO $$
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_order_items' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE lats_purchase_order_items 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to lats_purchase_order_items';
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_order_items' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE lats_purchase_order_items 
        ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to lats_purchase_order_items';
    END IF;
END $$;

-- =====================================================
-- ENSURE INVENTORY ITEMS TABLE IS PROPERLY SET UP
-- =====================================================

-- Make sure the inventory_items table exists and has all required columns
DO $$
BEGIN
    -- Check if the table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
        CREATE TABLE inventory_items (
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
        RAISE NOTICE 'Created inventory_items table';
    END IF;
END $$;

-- =====================================================
-- ENSURE INVENTORY ADJUSTMENTS TABLE EXISTS
-- =====================================================

-- Make sure the lats_inventory_adjustments table exists
DO $$
BEGIN
    -- Check if the table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_inventory_adjustments') THEN
        CREATE TABLE lats_inventory_adjustments (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
            variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
            adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'receive', 'sale', 'return', 'damage', 'loss')),
            quantity INTEGER NOT NULL,
            reason TEXT NOT NULL,
            reference_id UUID, -- Links to purchase order, sale, etc.
            reference_type VARCHAR(50), -- 'purchase_order', 'sale', 'manual', etc.
            notes TEXT,
            created_by UUID REFERENCES auth_users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created lats_inventory_adjustments table';
    END IF;
END $$;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Purchase order items indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id 
    ON lats_purchase_order_items(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id 
    ON lats_purchase_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_variant_id 
    ON lats_purchase_order_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_received_quantity 
    ON lats_purchase_order_items(received_quantity);

-- Inventory items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id 
    ON inventory_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_variant_id 
    ON inventory_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_serial_number 
    ON inventory_items(serial_number);

CREATE INDEX IF NOT EXISTS idx_inventory_items_status 
    ON inventory_items(status);

CREATE INDEX IF NOT EXISTS idx_inventory_items_metadata_po_id 
    ON inventory_items USING GIN (metadata);

-- Inventory adjustments indexes
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id 
    ON lats_inventory_adjustments(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_variant_id 
    ON lats_inventory_adjustments(variant_id);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_reference 
    ON lats_inventory_adjustments(reference_id, reference_type);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE lats_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase order items
CREATE POLICY "Enable read access for all users" ON lats_purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_purchase_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_purchase_order_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_purchase_order_items FOR DELETE USING (true);

-- Create RLS policies for inventory items
CREATE POLICY "Enable read access for all users" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON inventory_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON inventory_items FOR DELETE USING (true);

-- Create RLS policies for inventory adjustments
CREATE POLICY "Enable read access for all users" ON lats_inventory_adjustments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_inventory_adjustments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_inventory_adjustments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_inventory_adjustments FOR DELETE USING (true);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create or replace function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_purchase_order_items_updated_at
    BEFORE UPDATE ON lats_purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get purchase order items with product details
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

-- Function to get received items for a purchase order
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

-- =====================================================
-- VERIFY MIGRATION
-- =====================================================

-- Verify all tables exist and have required columns
DO $$
BEGIN
    -- Check purchase order items table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'lats_purchase_order_items'
    ) THEN
        RAISE EXCEPTION 'lats_purchase_order_items table not created';
    END IF;

    -- Check inventory items table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'inventory_items'
    ) THEN
        RAISE EXCEPTION 'inventory_items table not created';
    END IF;

    -- Check inventory adjustments table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'lats_inventory_adjustments'
    ) THEN
        RAISE EXCEPTION 'lats_inventory_adjustments table not created';
    END IF;

    RAISE NOTICE 'Migration completed successfully - All tables and functions created';
END $$;
