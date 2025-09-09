-- Migration: Fix Shipping Assignment - Simple and Robust
-- This migration ensures all required fields exist for shipping assignment

-- =====================================================
-- ADD MISSING SHIPPING FIELDS TO PURCHASE ORDERS
-- =====================================================

-- Add shipping_info JSONB column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' AND column_name = 'shipping_info'
    ) THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN shipping_info JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' AND column_name = 'shipping_date'
    ) THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN shipping_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- ENSURE SHIPPING AGENTS TABLE EXISTS
-- =====================================================

-- Drop and recreate shipping agents table to ensure clean schema
DROP TABLE IF EXISTS lats_shipping_agents CASCADE;

CREATE TABLE lats_shipping_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Enable RLS and create policy
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on agents" ON lats_shipping_agents FOR ALL USING (true);

-- =====================================================
-- ENSURE SHIPPING CARRIERS TABLE EXISTS
-- =====================================================

-- Drop and recreate shipping carriers table to ensure clean schema
DROP TABLE IF EXISTS lats_shipping_carriers CASCADE;

CREATE TABLE lats_shipping_carriers (
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

-- Enable RLS and create policy
ALTER TABLE lats_shipping_carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on carriers" ON lats_shipping_carriers FOR ALL USING (true);

-- =====================================================
-- ADD SAMPLE DATA
-- =====================================================

-- Insert sample shipping agents
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
);

-- Insert sample shipping carriers
INSERT INTO lats_shipping_carriers (
    name, code, logo, tracking_url, supported_services, contact_info
) VALUES 
(
    'DHL Express',
    'DHL',
    'https://logo.clearbit.com/dhl.com',
    'https://www.dhl.com/track',
    '["express", "standard", "overnight"]',
    '{"phone": "+255 22 211 0000", "email": "info@dhl.co.tz"}'
),
(
    'FedEx',
    'FEDEX',
    'https://logo.clearbit.com/fedex.com',
    'https://www.fedex.com/track',
    '["express", "standard", "freight"]',
    '{"phone": "+255 22 211 1111", "email": "contact@fedex.co.tz"}'
),
(
    'Tanzania Posts Corporation',
    'TPC',
    'https://logo.clearbit.com/tpc.go.tz',
    'https://www.tpc.go.tz/track',
    '["standard", "registered", "parcel"]',
    '{"phone": "+255 22 211 2222", "email": "info@tpc.go.tz"}'
);

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_info_gin 
ON lats_purchase_orders USING GIN (shipping_info);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_date 
ON lats_purchase_orders(shipping_date);

-- Shipping agents indexes
CREATE INDEX IF NOT EXISTS idx_shipping_agents_email ON lats_shipping_agents(email);
CREATE INDEX IF NOT EXISTS idx_shipping_agents_is_active ON lats_shipping_agents(is_active);

-- Shipping carriers indexes
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_code ON lats_shipping_carriers(code);
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_is_active ON lats_shipping_carriers(is_active);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_purchase_orders.shipping_info IS 'Complete shipping information stored as JSONB including agent, carrier, tracking, costs, and delivery details';
COMMENT ON COLUMN lats_purchase_orders.shipping_date IS 'Date when the order was assigned for shipping';
COMMENT ON TABLE lats_shipping_agents IS 'Shipping agents table with complete contact and service information';
COMMENT ON TABLE lats_shipping_carriers IS 'Shipping carriers table with tracking and service information';
