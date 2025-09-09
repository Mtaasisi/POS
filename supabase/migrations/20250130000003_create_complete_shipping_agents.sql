-- Complete Shipping Agents Migration
-- This migration creates the shipping agents system with all required fields

-- =====================================================
-- CREATE SHIPPING AGENTS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES lats_shipping_managers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    is_active BOOLEAN DEFAULT true,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EXTEND SHIPPING AGENTS TABLE WITH NEW FIELDS
-- =====================================================
ALTER TABLE lats_shipping_agents 
ADD COLUMN IF NOT EXISTS supported_shipping_types JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Tanzania',
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS price_per_cbm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS minimum_order_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS average_delivery_time TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_shipments INTEGER DEFAULT 0;

-- =====================================================
-- CREATE OFFICE LOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_agent_offices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES lats_shipping_agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    is_main_office BOOLEAN DEFAULT false,
    coordinates JSONB, -- {latitude: number, longitude: number}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_agent_id ON lats_shipping_agent_offices(agent_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_main ON lats_shipping_agent_offices(agent_id, is_main_office);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_manager_id ON lats_shipping_agents(manager_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_email ON lats_shipping_agents(email);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_company ON lats_shipping_agents(company);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for shipping agents
DROP TRIGGER IF EXISTS update_shipping_agents_updated_at ON lats_shipping_agents;
CREATE TRIGGER update_shipping_agents_updated_at
    BEFORE UPDATE ON lats_shipping_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for shipping agent offices
DROP TRIGGER IF EXISTS update_shipping_agent_offices_updated_at ON lats_shipping_agent_offices;
CREATE TRIGGER update_shipping_agent_offices_updated_at
    BEFORE UPDATE ON lats_shipping_agent_offices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert sample shipping agents
INSERT INTO lats_shipping_agents (
    name, email, phone, company, is_active, manager_id,
    supported_shipping_types, address, city, country, website,
    service_areas, specializations, price_per_cbm, price_per_kg,
    minimum_order_value, average_delivery_time, notes, rating, total_shipments
) VALUES 
(
    'Ahmed Hassan',
    'ahmed@maersk.com',
    '+255 22 213 4567',
    'Maersk Tanzania',
    true,
    NULL,
    '["sea", "air"]',
    'Harbor View Road, Kivukoni',
    'Dar es Salaam',
    'Tanzania',
    'https://maersk.com',
    '["international", "regional"]',
    '["bulk", "electronics"]',
    45000.00,
    8500.00,
    100000.00,
    '15-30 days',
    'Reliable sea freight specialist',
    4.8,
    156
),
(
    'Grace Mwamba',
    'grace@msc.com',
    '+255 22 211 2345',
    'MSC Tanzania',
    true,
    NULL,
    '["sea"]',
    'Port Road, Kurasini',
    'Dar es Salaam',
    'Tanzania',
    'https://msc.com',
    '["international"]',
    '["bulk", "fragile"]',
    42000.00,
    NULL,
    80000.00,
    '20-35 days',
    'Specializes in container shipping',
    4.6,
    89
),
(
    'Peter Kilonzo',
    'peter@cosco.com',
    '+255 22 284 5678',
    'COSCO Shipping',
    true,
    NULL,
    '["sea", "air", "local"]',
    'Airport Road, Terminal 2',
    'Dar es Salaam',
    'Tanzania',
    'https://cosco.com',
    '["domestic", "international"]',
    '["express", "electronics"]',
    48000.00,
    12000.00,
    50000.00,
    '10-25 days',
    'Multi-modal shipping solutions',
    4.4,
    67
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample office locations
INSERT INTO lats_shipping_agent_offices (agent_id, name, address, city, country, phone, email, is_main_office)
SELECT 
    sa.id,
    'Dar es Salaam Main Office',
    'Harbor View Road, Kivukoni',
    'Dar es Salaam',
    'Tanzania',
    '+255 22 213 4567',
    'dod@maersk.com',
    true
FROM lats_shipping_agents sa WHERE sa.email = 'ahmed@maersk.com'
UNION ALL
SELECT 
    sa.id,
    'Mombasa Branch',
    'Kilindini Road, Port Area',
    'Mombasa',
    'Kenya',
    '+254 41 222 3456',
    'mombasa@maersk.com',
    false
FROM lats_shipping_agents sa WHERE sa.email = 'ahmed@maersk.com'
UNION ALL
SELECT 
    sa.id,
    'Dar es Salaam Office',
    'Port Road, Kurasini',
    'Dar es Salaam',
    'Tanzania',
    '+255 22 211 2345',
    'dod@msc.com',
    true
FROM lats_shipping_agents sa WHERE sa.email = 'grace@msc.com'
UNION ALL
SELECT 
    sa.id,
    'Dar es Salaam Main Office',
    'Airport Road, Terminal 2',
    'Dar es Salaam',
    'Tanzania',
    '+255 22 284 5678',
    'dod@cosco.com',
    true
FROM lats_shipping_agents sa WHERE sa.email = 'peter@cosco.com'
UNION ALL
SELECT 
    sa.id,
    'Arusha Branch',
    'Nelson Mandela Road',
    'Arusha',
    'Tanzania',
    '+255 27 250 1234',
    'arusha@cosco.com',
    false
FROM lats_shipping_agents sa WHERE sa.email = 'peter@cosco.com'
UNION ALL
SELECT 
    sa.id,
    'Nairobi Office',
    'Jomo Kenyatta Airport',
    'Nairobi',
    'Kenya',
    '+254 20 822 111',
    'nairobi@cosco.com',
    false
FROM lats_shipping_agents sa WHERE sa.email = 'peter@cosco.com';

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Enable RLS on shipping agents table
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shipping agents
CREATE POLICY "Users can view shipping agents" ON lats_shipping_agents
    FOR SELECT USING (true);

CREATE POLICY "Users can insert shipping agents" ON lats_shipping_agents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update shipping agents" ON lats_shipping_agents
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete shipping agents" ON lats_shipping_agents
    FOR DELETE USING (true);

-- Enable RLS on shipping agent offices table
ALTER TABLE lats_shipping_agent_offices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shipping agent offices
CREATE POLICY "Users can view shipping agent offices" ON lats_shipping_agent_offices
    FOR SELECT USING (true);

CREATE POLICY "Users can insert shipping agent offices" ON lats_shipping_agent_offices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update shipping agent offices" ON lats_shipping_agent_offices
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete shipping agent offices" ON lats_shipping_agent_offices
    FOR DELETE USING (true);

-- =====================================================
-- CREATE VIEWS FOR EASY QUERYING
-- =====================================================

-- Create view for shipping agents with office count
CREATE OR REPLACE VIEW lats_shipping_agents_with_offices AS
SELECT 
    sa.*,
    COUNT(sao.id) as office_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id', sao.id,
                'name', sao.name,
                'address', sao.address,
                'city', sao.city,
                'country', sao.country,
                'phone', sao.phone,
                'email', sao.email,
                'isMainOffice', sao.is_main_office,
                'coordinates', sao.coordinates
            ) ORDER BY sao.is_main_office DESC, sao.created_at ASC
        ) FILTER (WHERE sao.id IS NOT NULL),
        '[]'::json
    ) as offices
FROM lats_shipping_agents sa
LEFT JOIN lats_shipping_agent_offices sao ON sa.id = sao.agent_id
GROUP BY sa.id;

-- Grant permissions on the view
GRANT SELECT ON lats_shipping_agents_with_offices TO authenticated;
