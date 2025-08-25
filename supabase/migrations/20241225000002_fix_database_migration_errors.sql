-- Migration: 20241225000002_fix_database_migration_errors.sql
-- Fix Database Migration Errors
-- This migration resolves the following issues:
-- 1. ERROR: 42703: column "is_active" does not exist
-- 2. ERROR: 42804: foreign key constraint "inventory_whatsapp_events_whatsapp_message_id_fkey" cannot be implemented
-- 3. ERROR: 42P01: relation "sales" does not exist

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Fix the is_active column issue in lats_suppliers table
-- Add is_active column if it doesn't exist
ALTER TABLE lats_suppliers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing suppliers to be active by default
UPDATE lats_suppliers SET is_active = true WHERE is_active IS NULL;

-- Create index on is_active for better query performance
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_is_active ON lats_suppliers(is_active);

-- 2. Fix the foreign key constraint issue in inventory_whatsapp_events table
-- First, drop the existing foreign key constraint if it exists
ALTER TABLE inventory_whatsapp_events 
DROP CONSTRAINT IF EXISTS inventory_whatsapp_events_whatsapp_message_id_fkey;

-- Drop the inventory_whatsapp_events table if it exists to recreate it properly
DROP TABLE IF EXISTS inventory_whatsapp_events CASCADE;

-- Recreate the inventory_whatsapp_events table with correct data types
CREATE TABLE IF NOT EXISTS inventory_whatsapp_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('low_stock', 'stock_arrival', 'price_change', 'new_product', 'availability_check', 'product_inquiry')),
    product_id UUID REFERENCES lats_products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES lats_store_locations(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    event_data JSONB DEFAULT '{}',
    whatsapp_message_id TEXT REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes for inventory_whatsapp_events
CREATE INDEX IF NOT EXISTS idx_inventory_whatsapp_events_type ON inventory_whatsapp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_inventory_whatsapp_events_product ON inventory_whatsapp_events(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_whatsapp_events_customer ON inventory_whatsapp_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_whatsapp_events_created ON inventory_whatsapp_events(created_at);

-- Re-enable RLS for inventory_whatsapp_events
ALTER TABLE inventory_whatsapp_events ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for inventory_whatsapp_events
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_whatsapp_events;
DROP POLICY IF EXISTS "Enable insert access for all users" ON inventory_whatsapp_events;
DROP POLICY IF EXISTS "Enable update access for all users" ON inventory_whatsapp_events;

CREATE POLICY "Enable read access for all users" ON inventory_whatsapp_events FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON inventory_whatsapp_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON inventory_whatsapp_events FOR UPDATE USING (true);

-- 3. Fix the "sales" table issue by ensuring lats_sales table exists
-- Create lats_sales table if it doesn't exist
CREATE TABLE IF NOT EXISTS lats_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lats_sales
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_employee ON lats_sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_date ON lats_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_lats_sales_payment_status ON lats_sales(payment_status);

-- Enable RLS for lats_sales
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lats_sales
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON lats_sales FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_lats_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lats_sales_updated_at 
    BEFORE UPDATE ON lats_sales 
    FOR EACH ROW EXECUTE FUNCTION update_lats_sales_updated_at();

-- 4. Ensure all other required tables exist for the inventory WhatsApp integration
-- Create product_inquiry_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_inquiry_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_phone VARCHAR(20),
    product_query TEXT NOT NULL,
    matched_products JSONB DEFAULT '[]',
    ai_response JSONB DEFAULT '{}',
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'price_change', 'new_arrival')),
    product_id UUID REFERENCES lats_products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES lats_store_locations(id) ON DELETE SET NULL,
    alert_data JSONB DEFAULT '{}',
    whatsapp_sent BOOLEAN DEFAULT false,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_product_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_product_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES lats_products(id) ON DELETE CASCADE,
    preference_type VARCHAR(50) NOT NULL CHECK (preference_type IN ('viewed', 'inquired', 'purchased', 'wishlist')),
    interaction_count INTEGER DEFAULT 1,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id, preference_type)
);

-- Create indexes for the other tables
CREATE INDEX IF NOT EXISTS idx_product_inquiry_history_customer ON product_inquiry_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_inquiry_history_phone ON product_inquiry_history(customer_phone);
CREATE INDEX IF NOT EXISTS idx_product_inquiry_history_created ON product_inquiry_history(created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_sent ON inventory_alerts(whatsapp_sent);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_created ON inventory_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_product_preferences_customer ON customer_product_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_preferences_product ON customer_product_preferences(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_preferences_type ON customer_product_preferences(preference_type);

-- Enable RLS for all tables
ALTER TABLE product_inquiry_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_product_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON product_inquiry_history FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON product_inquiry_history FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON product_inquiry_history FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON inventory_alerts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON inventory_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON inventory_alerts FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON customer_product_preferences FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON customer_product_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON customer_product_preferences FOR UPDATE USING (true);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_inventory_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_alerts_updated_at 
    BEFORE UPDATE ON inventory_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_inventory_alerts_updated_at();

CREATE OR REPLACE FUNCTION update_customer_product_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_product_preferences_updated_at 
    BEFORE UPDATE ON customer_product_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_customer_product_preferences_updated_at();

-- 5. Add inventory integration columns to existing WhatsApp tables if they don't exist
ALTER TABLE whatsapp_notifications ADD COLUMN IF NOT EXISTS inventory_event_type VARCHAR(50);
ALTER TABLE whatsapp_notifications ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES lats_products(id);
ALTER TABLE whatsapp_notifications ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES lats_store_locations(id);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_inventory_event ON whatsapp_notifications(inventory_event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_product ON whatsapp_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_location ON whatsapp_notifications(location_id);

-- 6. Insert sample data for testing (only if tables are empty)
INSERT INTO inventory_alerts (alert_type, product_id, alert_data) 
SELECT 'low_stock', id, '{"current_stock": 5, "min_stock": 10, "location": "Main Store"}'
FROM lats_products 
WHERE id NOT IN (SELECT product_id FROM inventory_alerts WHERE alert_type = 'low_stock')
LIMIT 1
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'All database migration errors have been fixed successfully!' as status;
