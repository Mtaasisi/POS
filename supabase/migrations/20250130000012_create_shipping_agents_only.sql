-- Create shipping agents table and view
-- This creates the agents table and the view that the code expects

CREATE TABLE IF NOT EXISTS lats_shipping_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
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

-- Create agent offices table
CREATE TABLE IF NOT EXISTS lats_shipping_agent_offices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT DEFAULT 'Tanzania',
    phone TEXT,
    email TEXT,
    coordinates JSONB,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipping_agents_is_active ON lats_shipping_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_agent_id ON lats_shipping_agent_offices(agent_id);

-- Enable RLS
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_agent_offices ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Allow all operations on agents" ON lats_shipping_agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on offices" ON lats_shipping_agent_offices FOR ALL USING (true);

-- Create the view that the code expects
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
                'email', o.email,
                'coordinates', o.coordinates,
                'isPrimary', o.is_primary
            )
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'::json
    ) as offices
FROM lats_shipping_agents sa
LEFT JOIN lats_shipping_agent_offices o ON sa.id = o.agent_id
GROUP BY sa.id;
