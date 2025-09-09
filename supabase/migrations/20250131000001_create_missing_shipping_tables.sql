-- Create Missing Shipping Tables Migration
-- This migration creates the essential shipping tables that are missing

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
-- SHIPPING INFO TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    carrier_id UUID REFERENCES lats_shipping_carriers(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES lats_shipping_agents(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES lats_shipping_managers(id) ON DELETE SET NULL,
    tracking_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')),
    estimated_delivery DATE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(10,2) DEFAULT 0,
    require_signature BOOLEAN DEFAULT false,
    enable_insurance BOOLEAN DEFAULT false,
    insurance_value DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SHIPPING EVENTS TABLE (Tracking History)
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipping_id UUID NOT NULL REFERENCES lats_shipping_info(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_automated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SHIPPING SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_assign_agents BOOLEAN DEFAULT true,
    default_carrier_id UUID REFERENCES lats_shipping_carriers(id) ON DELETE SET NULL,
    enable_tracking BOOLEAN DEFAULT true,
    enable_notifications BOOLEAN DEFAULT true,
    notification_channels JSONB DEFAULT '["email", "sms"]',
    tracking_update_interval INTEGER DEFAULT 60,
    default_shipping_cost DECIMAL(10,2) DEFAULT 0,
    auto_update_status BOOLEAN DEFAULT true,
    require_signature BOOLEAN DEFAULT false,
    enable_insurance BOOLEAN DEFAULT false,
    max_shipping_cost DECIMAL(10,2) DEFAULT 50000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default carriers
INSERT INTO lats_shipping_carriers (name, code, tracking_url, supported_services, contact_info) VALUES
('DHL Tanzania', 'DHL', 'https://www.dhl.com/tz-en/home/tracking.html?tracking-id={tracking_number}', 
 '["express", "standard", "overnight"]', '{"phone": "+255 22 211 0000", "email": "info@dhl.co.tz"}'),
('TNT Tanzania', 'TNT', 'https://www.tnt.com/express/en_tz/site/shipping-tools/track.html?searchType=con&cons={tracking_number}', 
 '["express", "standard"]', '{"phone": "+255 22 211 0000", "email": "info@tnt.co.tz"}'),
('Posta Tanzania', 'POSTA', 'https://www.posta.co.tz/track/{tracking_number}', 
 '["standard", "registered"]', '{"phone": "+255 22 211 0000", "email": "info@posta.co.tz"}'),
('FedEx Tanzania', 'FEDEX', 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}', 
 '["express", "overnight"]', '{"phone": "+255 22 211 0000", "email": "info@fedex.co.tz"}'),
('Local Courier', 'LOCAL', 'https://www.google.com/search?q=local+courier+tracking+{tracking_number}', 
 '["standard", "express"]', '{"phone": "+255 123 456 789", "email": "info@localcourier.co.tz"}')
ON CONFLICT (code) DO NOTHING;

-- Insert default managers
INSERT INTO lats_shipping_managers (name, email, phone, department) VALUES
('Manager', 'manager@shipping.com', '+255 123 456 789', 'Logistics'),
('Logistics Manager', 'logistics@shipping.com', '+255 987 654 321', 'Logistics')
ON CONFLICT DO NOTHING;

-- Insert default agents
INSERT INTO lats_shipping_agents (name, email, phone, company) VALUES
('Manager', 'manager@shipping.com', '+255 123 456 789', 'Shipping Company'),
('Shipping Agent', 'agent@shipping.com', '+255 987 654 321', 'Shipping Company')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE lats_shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON lats_shipping_carriers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_shipping_managers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_shipping_agents
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_shipping_info
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_shipping_events
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_shipping_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users
GRANT ALL ON lats_shipping_carriers TO authenticated;
GRANT ALL ON lats_shipping_managers TO authenticated;
GRANT ALL ON lats_shipping_agents TO authenticated;
GRANT ALL ON lats_shipping_info TO authenticated;
GRANT ALL ON lats_shipping_events TO authenticated;
GRANT ALL ON lats_shipping_settings TO authenticated;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_shipping_info_purchase_order ON lats_shipping_info(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_info_tracking_number ON lats_shipping_info(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_info_status ON lats_shipping_info(status);
CREATE INDEX IF NOT EXISTS idx_shipping_events_shipping_id ON lats_shipping_events(shipping_id);
CREATE INDEX IF NOT EXISTS idx_shipping_events_timestamp ON lats_shipping_events(timestamp);

-- =====================================================
-- CREATE UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_shipping_carriers_updated_at
    BEFORE UPDATE ON lats_shipping_carriers
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipping_managers_updated_at
    BEFORE UPDATE ON lats_shipping_managers
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipping_agents_updated_at
    BEFORE UPDATE ON lats_shipping_agents
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipping_info_updated_at
    BEFORE UPDATE ON lats_shipping_info
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();

CREATE TRIGGER update_shipping_settings_updated_at
    BEFORE UPDATE ON lats_shipping_settings
    FOR EACH ROW EXECUTE FUNCTION update_shipping_updated_at();
