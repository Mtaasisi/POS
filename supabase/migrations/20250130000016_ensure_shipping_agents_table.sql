-- Ensure lats_shipping_agents table exists with correct schema
-- This migration can be applied manually to fix the 400 error

-- Drop the table if it exists to start fresh
DROP TABLE IF EXISTS lats_shipping_agents CASCADE;

-- Create the table with the correct schema
CREATE TABLE lats_shipping_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    company TEXT,
    is_active BOOLEAN DEFAULT true,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supported_shipping_types JSONB DEFAULT '[]',
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Tanzania',
    website TEXT,
    service_areas JSONB DEFAULT '[]',
    specializations JSONB DEFAULT '[]',
    price_per_cbm DECIMAL(10,2),
    price_per_kg DECIMAL(10,2),
    minimum_order_value DECIMAL(10,2),
    average_delivery_time TEXT,
    notes TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    total_shipments INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipping_agents_is_active ON lats_shipping_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_email ON lats_shipping_agents(email);

-- Enable RLS
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policy
CREATE POLICY "Allow all operations on agents" ON lats_shipping_agents FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON lats_shipping_agents TO authenticated;
GRANT ALL ON lats_shipping_agents TO anon;
