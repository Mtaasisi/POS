-- Enhanced Shipping Integration Migration
-- This migration creates comprehensive shipping tracking tables for purchase orders

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
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
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
-- SHIPPING INFO TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lats_shipping_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    carrier_id UUID NOT NULL REFERENCES lats_shipping_carriers(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tracking_number, carrier_id)
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
    business_id UUID REFERENCES lats_businesses(id) ON DELETE CASCADE,
    auto_assign_agents BOOLEAN DEFAULT true,
    default_carrier_id UUID REFERENCES lats_shipping_carriers(id) ON DELETE SET NULL,
    enable_tracking BOOLEAN DEFAULT true,
    enable_notifications BOOLEAN DEFAULT true,
    notification_channels JSONB DEFAULT '["email", "sms"]',
    tracking_update_interval INTEGER DEFAULT 60, -- minutes
    default_shipping_cost DECIMAL(10,2) DEFAULT 0,
    auto_update_status BOOLEAN DEFAULT true,
    require_signature BOOLEAN DEFAULT false,
    enable_insurance BOOLEAN DEFAULT false,
    max_shipping_cost DECIMAL(10,2) DEFAULT 50000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- INSERT DEFAULT CARRIERS
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
 '{"phone": "+255 700 000 000", "email": "support@local-courier.co.tz"}');

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shipping_info_po_id ON lats_shipping_info(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_info_tracking ON lats_shipping_info(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_info_status ON lats_shipping_info(status);
CREATE INDEX IF NOT EXISTS idx_shipping_events_shipping_id ON lats_shipping_events(shipping_id);
CREATE INDEX IF NOT EXISTS idx_shipping_events_timestamp ON lats_shipping_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_manager_id ON lats_shipping_agents(manager_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Shipping Carriers (public read, admin write)
ALTER TABLE lats_shipping_carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read carriers" ON lats_shipping_carriers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage carriers" ON lats_shipping_carriers FOR ALL USING (auth.uid() IS NOT NULL);

-- Shipping Managers
ALTER TABLE lats_shipping_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own business managers" ON lats_shipping_managers FOR SELECT USING (
    business_id IN (SELECT id FROM lats_businesses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own business managers" ON lats_shipping_managers FOR ALL USING (
    user_id = auth.uid() OR business_id IN (SELECT id FROM lats_businesses WHERE user_id = auth.uid())
);

-- Shipping Agents
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own business agents" ON lats_shipping_agents FOR SELECT USING (
    business_id IN (SELECT id FROM lats_businesses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own business agents" ON lats_shipping_agents FOR ALL USING (
    user_id = auth.uid() OR business_id IN (SELECT id FROM lats_businesses WHERE user_id = auth.uid())
);

-- Shipping Info
ALTER TABLE lats_shipping_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own shipping info" ON lats_shipping_info FOR SELECT USING (
    purchase_order_id IN (SELECT id FROM lats_purchase_orders WHERE created_by = auth.uid())
);
CREATE POLICY "Users can manage own shipping info" ON lats_shipping_info FOR ALL USING (
    purchase_order_id IN (SELECT id FROM lats_purchase_orders WHERE created_by = auth.uid())
);

-- Shipping Events
ALTER TABLE lats_shipping_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own shipping events" ON lats_shipping_events FOR SELECT USING (
    shipping_id IN (
        SELECT si.id FROM lats_shipping_info si 
        JOIN lats_purchase_orders po ON si.purchase_order_id = po.id 
        WHERE po.created_by = auth.uid()
    )
);
CREATE POLICY "Users can manage own shipping events" ON lats_shipping_events FOR ALL USING (
    shipping_id IN (
        SELECT si.id FROM lats_shipping_info si 
        JOIN lats_purchase_orders po ON si.purchase_order_id = po.id 
        WHERE po.created_by = auth.uid()
    )
);

-- Shipping Settings
ALTER TABLE lats_shipping_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own shipping settings" ON lats_shipping_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own shipping settings" ON lats_shipping_settings FOR ALL USING (user_id = auth.uid());

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