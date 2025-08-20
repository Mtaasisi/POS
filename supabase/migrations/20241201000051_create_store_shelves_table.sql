-- Create Store Shelves Table Migration
-- Migration: 20241201000051_create_store_shelves_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Store Shelves table
CREATE TABLE IF NOT EXISTS lats_store_shelves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_location_id UUID NOT NULL REFERENCES lats_store_locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    
    -- Shelf Details
    shelf_type TEXT DEFAULT 'standard', -- 'standard', 'refrigerated', 'display', 'storage', 'specialty'
    section TEXT, -- 'electronics', 'accessories', 'parts', 'tools', etc.
    aisle TEXT,
    row_number INTEGER,
    column_number INTEGER,
    
    -- Physical Details
    width_cm INTEGER,
    height_cm INTEGER,
    depth_cm INTEGER,
    max_weight_kg DECIMAL(8,2),
    max_capacity INTEGER,
    current_capacity INTEGER DEFAULT 0,
    
    -- Location Details
    floor_level INTEGER DEFAULT 1,
    zone TEXT, -- 'front', 'back', 'left', 'right', 'center'
    coordinates JSONB, -- {x: number, y: number, z: number} for 3D positioning
    
    -- Status & Settings
    is_active BOOLEAN DEFAULT true,
    is_accessible BOOLEAN DEFAULT true,
    requires_ladder BOOLEAN DEFAULT false,
    is_refrigerated BOOLEAN DEFAULT false,
    temperature_range JSONB, -- {min: number, max: number} for refrigerated shelves
    
    -- Organization
    priority_order INTEGER DEFAULT 0,
    color_code TEXT, -- For visual organization
    barcode TEXT, -- For scanning
    
    -- Additional Information
    notes TEXT,
    images TEXT[] DEFAULT '{}',
    
    -- Audit Fields
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(store_location_id, code),
    CONSTRAINT valid_shelf_type CHECK (shelf_type IN ('standard', 'refrigerated', 'display', 'storage', 'specialty')),
    CONSTRAINT valid_zone CHECK (zone IN ('front', 'back', 'left', 'right', 'center') OR zone IS NULL),
    CONSTRAINT valid_capacity CHECK (current_capacity <= max_capacity OR max_capacity IS NULL),
    CONSTRAINT valid_weight CHECK (max_weight_kg > 0 OR max_weight_kg IS NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_store_shelves_location ON lats_store_shelves(store_location_id);
CREATE INDEX IF NOT EXISTS idx_lats_store_shelves_code ON lats_store_shelves(code);
CREATE INDEX IF NOT EXISTS idx_lats_store_shelves_type ON lats_store_shelves(shelf_type);
CREATE INDEX IF NOT EXISTS idx_lats_store_shelves_section ON lats_store_shelves(section);
CREATE INDEX IF NOT EXISTS idx_lats_store_shelves_zone ON lats_store_shelves(zone);
CREATE INDEX IF NOT EXISTS idx_lats_store_shelves_active ON lats_store_shelves(is_active);
CREATE INDEX IF NOT EXISTS idx_lats_store_shelves_priority ON lats_store_shelves(priority_order);

-- Enable Row Level Security
ALTER TABLE lats_store_shelves ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view store shelves" ON lats_store_shelves
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert store shelves" ON lats_store_shelves
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update store shelves" ON lats_store_shelves
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete store shelves" ON lats_store_shelves
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_lats_store_shelves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lats_store_shelves_updated_at 
    BEFORE UPDATE ON lats_store_shelves
    FOR EACH ROW
    EXECUTE FUNCTION update_lats_store_shelves_updated_at();

-- Create trigger to update current_capacity when products are added/removed
CREATE OR REPLACE FUNCTION update_shelf_capacity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update shelf capacity when product shelf changes
    IF TG_OP = 'UPDATE' THEN
        -- Decrease capacity from old shelf
        IF OLD.store_shelf IS NOT NULL AND OLD.store_shelf != NEW.store_shelf THEN
            UPDATE lats_store_shelves 
            SET current_capacity = GREATEST(0, current_capacity - 1)
            WHERE code = OLD.store_shelf;
        END IF;
        
        -- Increase capacity to new shelf
        IF NEW.store_shelf IS NOT NULL AND (OLD.store_shelf IS NULL OR OLD.store_shelf != NEW.store_shelf) THEN
            UPDATE lats_store_shelves 
            SET current_capacity = current_capacity + 1
            WHERE code = NEW.store_shelf;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        -- Increase capacity when product is added to shelf
        IF NEW.store_shelf IS NOT NULL THEN
            UPDATE lats_store_shelves 
            SET current_capacity = current_capacity + 1
            WHERE code = NEW.store_shelf;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease capacity when product is removed from shelf
        IF OLD.store_shelf IS NOT NULL THEN
            UPDATE lats_store_shelves 
            SET current_capacity = GREATEST(0, current_capacity - 1)
            WHERE code = OLD.store_shelf;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shelf_capacity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lats_products
    FOR EACH ROW
    EXECUTE FUNCTION update_shelf_capacity();

-- Insert default shelves for existing store locations
INSERT INTO lats_store_shelves (
    store_location_id,
    name,
    code,
    description,
    shelf_type,
    section,
    zone,
    max_capacity,
    priority_order
)
SELECT 
    sl.id,
    'Main Display Shelf',
    'SHELF001',
    'Main display shelf for electronics',
    'display',
    'electronics',
    'front',
    50,
    1
FROM lats_store_locations sl
WHERE NOT EXISTS (
    SELECT 1 FROM lats_store_shelves ss 
    WHERE ss.store_location_id = sl.id AND ss.code = 'SHELF001'
);

INSERT INTO lats_store_shelves (
    store_location_id,
    name,
    code,
    description,
    shelf_type,
    section,
    zone,
    max_capacity,
    priority_order
)
SELECT 
    sl.id,
    'Storage Shelf A',
    'SHELF002',
    'Storage shelf for accessories',
    'storage',
    'accessories',
    'back',
    100,
    2
FROM lats_store_locations sl
WHERE NOT EXISTS (
    SELECT 1 FROM lats_store_shelves ss 
    WHERE ss.store_location_id = sl.id AND ss.code = 'SHELF002'
);

INSERT INTO lats_store_shelves (
    store_location_id,
    name,
    code,
    description,
    shelf_type,
    section,
    zone,
    max_capacity,
    priority_order
)
SELECT 
    sl.id,
    'Parts Shelf',
    'SHELF003',
    'Shelf for repair parts',
    'specialty',
    'parts',
    'left',
    75,
    3
FROM lats_store_locations sl
WHERE NOT EXISTS (
    SELECT 1 FROM lats_store_shelves ss 
    WHERE ss.store_location_id = sl.id AND ss.code = 'SHELF003'
);
