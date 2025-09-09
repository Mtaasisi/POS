-- Clean Shipping Tables Migration
-- This migration creates the essential shipping tables with clean syntax

-- =====================================================
-- SHIPPING CARRIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_carriers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    logo TEXT,
    tracking_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    supported_services JSONB DEFAULT '[]',
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SHIPPING MANAGERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT DEFAULT 'Logistics',
    is_active BOOLEAN DEFAULT true,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SHIPPING AGENTS TABLE
-- =====================================================
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
    email TEXT,
    coordinates JSONB,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_code ON lats_shipping_carriers(code);
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_is_active ON lats_shipping_carriers(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_managers_is_active ON lats_shipping_managers(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_manager_id ON lats_shipping_agents(manager_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_is_active ON lats_shipping_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_agent_id ON lats_shipping_agent_offices(agent_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_is_primary ON lats_shipping_agent_offices(is_primary);

-- =====================================================
-- CREATE VIEW
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

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE lats_shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_agent_offices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read carriers" ON lats_shipping_carriers;
DROP POLICY IF EXISTS "Authenticated users can manage carriers" ON lats_shipping_carriers;
DROP POLICY IF EXISTS "Public can read managers" ON lats_shipping_managers;
DROP POLICY IF EXISTS "Authenticated users can manage managers" ON lats_shipping_managers;
DROP POLICY IF EXISTS "Public can read agents" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Authenticated users can manage agents" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Public can read agent offices" ON lats_shipping_agent_offices;
DROP POLICY IF EXISTS "Authenticated users can manage agent offices" ON lats_shipping_agent_offices;

-- Create new policies
CREATE POLICY "Public can read carriers" ON lats_shipping_carriers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage carriers" ON lats_shipping_carriers FOR ALL USING (true);
CREATE POLICY "Public can read managers" ON lats_shipping_managers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage managers" ON lats_shipping_managers FOR ALL USING (true);
CREATE POLICY "Public can read agents" ON lats_shipping_agents FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage agents" ON lats_shipping_agents FOR ALL USING (true);
CREATE POLICY "Public can read agent offices" ON lats_shipping_agent_offices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage agent offices" ON lats_shipping_agent_offices FOR ALL USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_shipping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shipping_carriers_updated_at ON lats_shipping_carriers;
DROP TRIGGER IF EXISTS update_shipping_managers_updated_at ON lats_shipping_managers;
DROP TRIGGER IF EXISTS update_shipping_agents_updated_at ON lats_shipping_agents;
DROP TRIGGER IF EXISTS update_shipping_agent_offices_updated_at ON lats_shipping_agent_offices;

CREATE TRIGGER update_shipping_carriers_updated_at
    BEFORE UPDATE ON lats_shipping_carriers
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipping_managers_updated_at
    BEFORE UPDATE ON lats_shipping_managers
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipping_agents_updated_at
    BEFORE UPDATE ON lats_shipping_agents
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipping_agent_offices_updated_at
    BEFORE UPDATE ON lats_shipping_agent_offices
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================
INSERT INTO lats_shipping_carriers (name, code, tracking_url, supported_services, contact_info) VALUES
('DHL Tanzania', 'DHL', 'https://www.dhl.com/tz-en/home/tracking.html?tracking-id={tracking_number}', 
 '["Express", "Standard", "Same Day"]', 
 '{"phone": "+255 22 211 8000", "email": "info@dhl.co.tz", "website": "https://www.dhl.com/tz-en"}'),
 
('Posta Tanzania', 'POSTA', 'https://www.posta.co.tz/tracking?number={tracking_number}', 
 '["Standard", "Express"]', 
 '{"phone": "+255 22 211 8400", "email": "info@posta.co.tz", "website": "https://www.posta.co.tz"}'),
 
('TNT Tanzania', 'TNT', 'https://www.tnt.com/express/en_tz/site/shipping-tools/tracking.html?searchType=CON&cons={tracking_number}', 
 '["Express", "Economy"]', 
 '{"phone": "+255 22 213 4300", "email": "info@tnt.co.tz"}'),
 
('FedEx Tanzania', 'FEDEX', 'https://www.fedex.com/apps/fedextrack/?action=track&trackingnumber={tracking_number}', 
 '["Express", "Ground"]', 
 '{"phone": "+255 22 260 0508", "email": "customer.service@fedex.com"}'),
 
('Local Courier', 'LOCAL', 'https://tracking.local-courier.co.tz/{tracking_number}', 
 '["Same Day", "Next Day", "Standard"]', 
 '{"phone": "+255 700 000 000", "email": "support@local-courier.co.tz"}')
ON CONFLICT (code) DO NOTHING;

INSERT INTO lats_shipping_managers (name, email, department, is_active)
SELECT 'Default Logistics Manager', 'logistics@company.com', 'Logistics', true
WHERE NOT EXISTS (SELECT 1 FROM lats_shipping_managers LIMIT 1);
