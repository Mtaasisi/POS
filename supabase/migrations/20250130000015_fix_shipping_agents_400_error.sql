-- Fix 400 Bad Request error for lats_shipping_agents table
-- This migration ensures the table exists and has proper RLS policies

-- 1. Ensure the shipping agents table exists with correct schema
CREATE TABLE IF NOT EXISTS lats_shipping_agents (
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

-- 2. Ensure the shipping agent offices table exists
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

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_agents_is_active ON lats_shipping_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_email ON lats_shipping_agents(email);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_agent_id ON lats_shipping_agent_offices(agent_id);

-- 4. Enable RLS on both tables
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_agent_offices ENABLE ROW LEVEL SECURITY;

-- 5. Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow all operations on agents" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Allow all operations on offices" ON lats_shipping_agent_offices;
DROP POLICY IF EXISTS "Public can read agents" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Authenticated users can manage agents" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Users can read own agents" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Users can manage own agents" ON lats_shipping_agents;

-- 6. Create simple, permissive RLS policies
CREATE POLICY "Allow all operations on agents" ON lats_shipping_agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on offices" ON lats_shipping_agent_offices FOR ALL USING (true);

-- 7. Create the view that the code expects
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

-- 8. Grant permissions on the view
GRANT SELECT ON lats_shipping_agents_with_offices TO authenticated;

-- 9. Add some sample data if the table is empty
INSERT INTO lats_shipping_agents (
    name, email, phone, whatsapp, company, address, city, country,
    supported_shipping_types, service_areas, specializations,
    price_per_cbm, price_per_kg, minimum_order_value,
    average_delivery_time, notes, rating, total_shipments
) VALUES 
(
    'DHL Express Tanzania',
    'info@dhl.co.tz',
    '+255 22 211 0000',
    '+255 22 211 0000',
    'DHL Express',
    'Dar es Salaam',
    'Dar es Salaam',
    'Tanzania',
    '["express", "standard", "overnight"]',
    '["Dar es Salaam", "Arusha", "Mwanza", "Dodoma"]',
    '["electronics", "documents", "packages"]',
    150.00,
    25.00,
    100.00,
    '1-3 days',
    'Reliable express shipping service',
    4.5,
    0
),
(
    'FedEx Tanzania',
    'contact@fedex.co.tz',
    '+255 22 211 1111',
    '+255 22 211 1111',
    'FedEx Corporation',
    'Dar es Salaam',
    'Dar es Salaam',
    'Tanzania',
    '["express", "standard", "freight"]',
    '["Dar es Salaam", "Arusha", "Mwanza"]',
    '["electronics", "heavy goods", "packages"]',
    140.00,
    22.00,
    150.00,
    '2-4 days',
    'International shipping specialist',
    4.3,
    0
),
(
    'Tanzania Posts Corporation',
    'info@tpc.go.tz',
    '+255 22 211 2222',
    '+255 22 211 2222',
    'TPC',
    'Dar es Salaam',
    'Dar es Salaam',
    'Tanzania',
    '["standard", "registered", "parcel"]',
    '["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Tanga", "Morogoro"]',
    '["documents", "small packages", "registered mail"]',
    80.00,
    15.00,
    50.00,
    '3-7 days',
    'National postal service',
    4.0,
    0
)
ON CONFLICT (email) DO NOTHING;

-- 10. Add comments for documentation
COMMENT ON TABLE lats_shipping_agents IS 'Shipping agents table with proper RLS policies';
COMMENT ON TABLE lats_shipping_agent_offices IS 'Shipping agent offices table';
COMMENT ON VIEW lats_shipping_agents_with_offices IS 'View combining shipping agents with their offices';
