-- Create Store Locations Table Migration
-- Migration: 20241201000050_create_store_locations_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Store Locations table
CREATE TABLE IF NOT EXISTS lats_store_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    
    -- Location Details
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT,
    country TEXT DEFAULT 'Tanzania',
    postal_code TEXT,
    coordinates JSONB, -- {lat: number, lng: number}
    
    -- Contact Information
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    
    -- Business Details
    manager_name TEXT,
    manager_phone TEXT,
    manager_email TEXT,
    
    -- Operating Hours
    opening_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"open": "10:00", "close": "16:00"}}',
    is_24_hours BOOLEAN DEFAULT false,
    
    -- Store Features
    has_parking BOOLEAN DEFAULT false,
    has_wifi BOOLEAN DEFAULT false,
    has_repair_service BOOLEAN DEFAULT true,
    has_sales_service BOOLEAN DEFAULT true,
    has_delivery_service BOOLEAN DEFAULT false,
    
    -- Capacity & Size
    store_size_sqm INTEGER,
    max_capacity INTEGER,
    current_staff_count INTEGER DEFAULT 0,
    
    -- Status & Settings
    is_active BOOLEAN DEFAULT true,
    is_main_branch BOOLEAN DEFAULT false,
    priority_order INTEGER DEFAULT 0,
    
    -- Financial Information
    monthly_rent DECIMAL(12,2),
    utilities_cost DECIMAL(12,2),
    monthly_target DECIMAL(12,2),
    
    -- Additional Information
    notes TEXT,
    images TEXT[] DEFAULT '{}',
    
    -- Audit Fields
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_store_locations_name ON lats_store_locations(name);
CREATE INDEX IF NOT EXISTS idx_lats_store_locations_code ON lats_store_locations(code);
CREATE INDEX IF NOT EXISTS idx_lats_store_locations_city ON lats_store_locations(city);
CREATE INDEX IF NOT EXISTS idx_lats_store_locations_region ON lats_store_locations(region);
CREATE INDEX IF NOT EXISTS idx_lats_store_locations_active ON lats_store_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_lats_store_locations_main_branch ON lats_store_locations(is_main_branch);
CREATE INDEX IF NOT EXISTS idx_lats_store_locations_priority ON lats_store_locations(priority_order);

-- Enable Row Level Security
ALTER TABLE lats_store_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view store locations" ON lats_store_locations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert store locations" ON lats_store_locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update store locations" ON lats_store_locations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete store locations" ON lats_store_locations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_lats_store_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lats_store_locations_updated_at 
    BEFORE UPDATE ON lats_store_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_lats_store_locations_updated_at();

-- Insert default main branch if no locations exist
INSERT INTO lats_store_locations (
    name, 
    code, 
    description, 
    address, 
    city, 
    country,
    is_main_branch,
    is_active,
    priority_order
) 
SELECT 
    'Main Branch',
    'MB001',
    'Main store location',
    'City Center',
    'Dar es Salaam',
    'Tanzania',
    true,
    true,
    1
WHERE NOT EXISTS (SELECT 1 FROM lats_store_locations WHERE is_main_branch = true);
