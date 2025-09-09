-- Create shipping agents table and view - Final clean version
-- This migration creates the minimal required structure for shipping agents

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SHIPPING AGENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Extended fields
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

-- =====================================================
-- SHIPPING AGENT OFFICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_agent_offices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT DEFAULT 'Tanzania',
    phone TEXT,
    coordinates JSONB, -- {latitude: number, longitude: number}
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shipping_agents_is_active ON lats_shipping_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_name ON lats_shipping_agents(name);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_agent_id ON lats_shipping_agent_offices(agent_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_is_primary ON lats_shipping_agent_offices(is_primary);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_agent_offices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on agents" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Allow all operations on offices" ON lats_shipping_agent_offices;

-- Create new policies
CREATE POLICY "Allow all operations on agents" ON lats_shipping_agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on offices" ON lats_shipping_agent_offices FOR ALL USING (true);

-- =====================================================
-- CREATE VIEW FOR EASY QUERYING
-- =====================================================
DROP VIEW IF EXISTS lats_shipping_agents_with_offices;

CREATE VIEW lats_shipping_agents_with_offices AS
SELECT 
    sa.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', o.id,
                'name', o.name,
                'address', o.address,
                'city', o.city,
                'country', o.country,
                'phone', o.phone,
                'coordinates', o.coordinates,
                'isPrimary', o.is_primary
            )
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'::json
    ) as offices
FROM lats_shipping_agents sa
LEFT JOIN lats_shipping_agent_offices o ON sa.id = o.agent_id
GROUP BY sa.id;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON lats_shipping_agents TO authenticated;
GRANT SELECT ON lats_shipping_agent_offices TO authenticated;
GRANT SELECT ON lats_shipping_agents_with_offices TO authenticated;

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE lats_shipping_agents IS 'Shipping agents table with basic information';
COMMENT ON TABLE lats_shipping_agent_offices IS 'Shipping agent offices with location information';
COMMENT ON VIEW lats_shipping_agents_with_offices IS 'View combining shipping agents with their offices';

-- =====================================================
-- INSERT SAMPLE DATA (Optional)
-- =====================================================
-- Insert a sample shipping agent for testing
INSERT INTO lats_shipping_agents (name, company, phone, address, city, is_active) 
VALUES ('Sample Shipping Agent', 'Sample Company', '+255 123 456 789', '123 Main St', 'Dar es Salaam', true)
ON CONFLICT DO NOTHING;
