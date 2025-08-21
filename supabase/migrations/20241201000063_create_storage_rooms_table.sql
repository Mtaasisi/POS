-- Create Storage Rooms Table Migration
-- Migration: 20241201000063_create_storage_rooms_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Storage Rooms table
CREATE TABLE IF NOT EXISTS lats_storage_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_location_id UUID NOT NULL REFERENCES lats_store_locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    
    -- Location Details
    floor_level INTEGER DEFAULT 1,
    
    -- Physical Details
    area_sqm DECIMAL(8,2), -- Area in square meters
    max_capacity INTEGER, -- Maximum capacity
    current_capacity INTEGER DEFAULT 0, -- Current capacity
    
    -- Status & Settings
    is_active BOOLEAN DEFAULT true,
    is_secure BOOLEAN DEFAULT false,
    requires_access_card BOOLEAN DEFAULT false,
    
    -- Visual Organization
    color_code TEXT, -- For visual organization
    
    -- Additional Information
    notes TEXT,
    
    -- Audit Fields
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(store_location_id, code),
    CONSTRAINT valid_capacity CHECK (current_capacity <= max_capacity OR max_capacity IS NULL),
    CONSTRAINT valid_area CHECK (area_sqm > 0 OR area_sqm IS NULL),
    CONSTRAINT valid_floor_level CHECK (floor_level > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_storage_rooms_location ON lats_storage_rooms(store_location_id);
CREATE INDEX IF NOT EXISTS idx_lats_storage_rooms_code ON lats_storage_rooms(code);
CREATE INDEX IF NOT EXISTS idx_lats_storage_rooms_active ON lats_storage_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_lats_storage_rooms_secure ON lats_storage_rooms(is_secure);
CREATE INDEX IF NOT EXISTS idx_lats_storage_rooms_floor ON lats_storage_rooms(floor_level);

-- Enable Row Level Security
ALTER TABLE lats_storage_rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view storage rooms" ON lats_storage_rooms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert storage rooms" ON lats_storage_rooms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update storage rooms" ON lats_storage_rooms
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete storage rooms" ON lats_storage_rooms
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_lats_storage_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lats_storage_rooms_updated_at 
    BEFORE UPDATE ON lats_storage_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_lats_storage_rooms_updated_at();

-- Create trigger to update current_capacity when products are added/removed
CREATE OR REPLACE FUNCTION update_storage_room_capacity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update storage room capacity when product storage room changes
    IF TG_OP = 'UPDATE' THEN
        -- Decrease capacity from old storage room
        IF OLD.storage_room_id IS NOT NULL AND OLD.storage_room_id != NEW.storage_room_id THEN
            UPDATE lats_storage_rooms 
            SET current_capacity = GREATEST(0, current_capacity - 1)
            WHERE id = OLD.storage_room_id;
        END IF;
        
        -- Increase capacity to new storage room
        IF NEW.storage_room_id IS NOT NULL AND (OLD.storage_room_id IS NULL OR OLD.storage_room_id != NEW.storage_room_id) THEN
            UPDATE lats_storage_rooms 
            SET current_capacity = current_capacity + 1
            WHERE id = NEW.storage_room_id;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        -- Increase capacity when product is added to storage room
        IF NEW.storage_room_id IS NOT NULL THEN
            UPDATE lats_storage_rooms 
            SET current_capacity = current_capacity + 1
            WHERE id = NEW.storage_room_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease capacity when product is removed from storage room
        IF OLD.storage_room_id IS NOT NULL THEN
            UPDATE lats_storage_rooms 
            SET current_capacity = GREATEST(0, current_capacity - 1)
            WHERE id = OLD.storage_room_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger will be created when we add storage_room_id to products table
-- CREATE TRIGGER update_storage_room_capacity_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON lats_products
--     FOR EACH ROW
--     EXECUTE FUNCTION update_storage_room_capacity();

-- Insert default storage rooms for existing store locations
INSERT INTO lats_storage_rooms (
    store_location_id,
    name,
    code,
    description,
    floor_level,
    area_sqm,
    max_capacity,
    is_active,
    is_secure,
    color_code
)
SELECT 
    sl.id,
    'Main Storage Room',
    'STOR001',
    'Main storage room for general inventory',
    1,
    100.0,
    500,
    true,
    false,
    '#3B82F6'
FROM lats_store_locations sl
WHERE NOT EXISTS (
    SELECT 1 FROM lats_storage_rooms sr 
    WHERE sr.store_location_id = sl.id AND sr.code = 'STOR001'
);

INSERT INTO lats_storage_rooms (
    store_location_id,
    name,
    code,
    description,
    floor_level,
    area_sqm,
    max_capacity,
    is_active,
    is_secure,
    color_code
)
SELECT 
    sl.id,
    'Secure Storage',
    'STOR002',
    'Secure storage room for valuable items',
    1,
    50.0,
    200,
    true,
    true,
    '#EF4444'
FROM lats_store_locations sl
WHERE NOT EXISTS (
    SELECT 1 FROM lats_storage_rooms sr 
    WHERE sr.store_location_id = sl.id AND sr.code = 'STOR002'
);

INSERT INTO lats_storage_rooms (
    store_location_id,
    name,
    code,
    description,
    floor_level,
    area_sqm,
    max_capacity,
    is_active,
    is_secure,
    color_code
)
SELECT 
    sl.id,
    'Electronics Storage',
    'STOR003',
    'Storage room for electronics and accessories',
    1,
    75.0,
    300,
    true,
    false,
    '#10B981'
FROM lats_store_locations sl
WHERE NOT EXISTS (
    SELECT 1 FROM lats_storage_rooms sr 
    WHERE sr.store_location_id = sl.id AND sr.code = 'STOR003'
);
