-- Minimal Shipping Tables Migration
-- This migration creates only the essential shipping tables without complex dependencies

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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES lats_shipping_managers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    is_active BOOLEAN DEFAULT true,
    avatar TEXT,
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
    agent_id UUID NOT NULL REFERENCES lats_shipping_agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT DEFAULT 'Tanzania',
    phone TEXT,
    email TEXT,
    coordinates JSONB, -- {latitude: number, longitude: number}
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_code ON lats_shipping_carriers(code);
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_is_active ON lats_shipping_carriers(is_active);

CREATE INDEX IF NOT EXISTS idx_shipping_managers_user_id ON lats_shipping_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_managers_is_active ON lats_shipping_managers(is_active);

CREATE INDEX IF NOT EXISTS idx_shipping_agents_user_id ON lats_shipping_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_manager_id ON lats_shipping_agents(manager_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_is_active ON lats_shipping_agents(is_active);

CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_agent_id ON lats_shipping_agent_offices(agent_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_is_primary ON lats_shipping_agent_offices(is_primary);

-- =====================================================
-- CREATE VIEWS
-- =====================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS lats_shipping_agents_with_offices;

-- Create view for shipping agents with their offices
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
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Shipping Carriers (public read, admin write)
ALTER TABLE lats_shipping_carriers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read carriers" ON lats_shipping_carriers;
DROP POLICY IF EXISTS "Authenticated users can manage carriers" ON lats_shipping_carriers;
CREATE POLICY "Public can read carriers" ON lats_shipping_carriers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage carriers" ON lats_shipping_carriers FOR ALL USING (auth.uid() IS NOT NULL);

-- Shipping Managers
ALTER TABLE lats_shipping_managers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own managers" ON lats_shipping_managers;
DROP POLICY IF EXISTS "Users can manage own managers" ON lats_shipping_managers;
CREATE POLICY "Users can read own managers" ON lats_shipping_managers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own managers" ON lats_shipping_managers FOR ALL USING (user_id = auth.uid());

-- Shipping Agents
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own agents" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Users can manage own agents" ON lats_shipping_agents;
CREATE POLICY "Users can read own agents" ON lats_shipping_agents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own agents" ON lats_shipping_agents FOR ALL USING (user_id = auth.uid());

-- Shipping Agent Offices
ALTER TABLE lats_shipping_agent_offices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own agent offices" ON lats_shipping_agent_offices;
DROP POLICY IF EXISTS "Users can manage own agent offices" ON lats_shipping_agent_offices;
CREATE POLICY "Users can read own agent offices" ON lats_shipping_agent_offices FOR SELECT USING (
    agent_id IN (SELECT id FROM lats_shipping_agents WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own agent offices" ON lats_shipping_agent_offices FOR ALL USING (
    agent_id IN (SELECT id FROM lats_shipping_agents WHERE user_id = auth.uid())
);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_shipping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
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

-- Insert default carriers if none exist
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

-- Insert a default shipping manager if none exist
INSERT INTO lats_shipping_managers (name, email, department, is_active)
SELECT 'Default Logistics Manager', 'logistics@company.com', 'Logistics', true
WHERE NOT EXISTS (SELECT 1 FROM lats_shipping_managers LIMIT 1);
