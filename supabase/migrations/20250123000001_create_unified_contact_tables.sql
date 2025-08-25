-- Migration: 20250123000001_create_unified_contact_tables.sql
-- Create tables for unified contact system that merges WhatsApp and phone functionality

-- =====================================================
-- CONTACT PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    preferred_method VARCHAR(20) CHECK (preferred_method IN ('whatsapp', 'sms', 'phone_call')) DEFAULT 'whatsapp',
    whatsapp_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    phone_call_enabled BOOLEAN DEFAULT true,
    quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "08:00"}',
    language VARCHAR(10) CHECK (language IN ('en', 'sw')) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id)
);

-- =====================================================
-- CONTACT HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL CHECK (method IN ('whatsapp', 'sms', 'phone_call')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('message', 'call')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'answered', 'missed')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT,
    duration INTEGER, -- for calls in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONTACT METHODS TABLE (for tracking available methods per customer)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('whatsapp', 'sms', 'phone_call')),
    phone_number VARCHAR(20) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_preferred BOOLEAN DEFAULT false,
    last_verified TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(20) DEFAULT 'unknown' CHECK (verification_status IN ('verified', 'unverified', 'unknown', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, method_type)
);

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Contact Preferences indexes
CREATE INDEX IF NOT EXISTS idx_contact_preferences_customer_id ON contact_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_contact_preferences_preferred_method ON contact_preferences(preferred_method);

-- Contact History indexes
CREATE INDEX IF NOT EXISTS idx_contact_history_customer_id ON contact_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_method ON contact_history(method);
CREATE INDEX IF NOT EXISTS idx_contact_history_timestamp ON contact_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_contact_history_status ON contact_history(status);

-- Contact Methods indexes
CREATE INDEX IF NOT EXISTS idx_contact_methods_customer_id ON contact_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_contact_methods_type ON contact_methods(method_type);
CREATE INDEX IF NOT EXISTS idx_contact_methods_available ON contact_methods(is_available);
CREATE INDEX IF NOT EXISTS idx_contact_methods_preferred ON contact_methods(is_preferred);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE contact_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_methods ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Contact Preferences policies
DROP POLICY IF EXISTS "Enable read access for all users" ON contact_preferences;
DROP POLICY IF EXISTS "Enable insert access for all users" ON contact_preferences;
DROP POLICY IF EXISTS "Enable update access for all users" ON contact_preferences;

CREATE POLICY "Enable read access for all users" ON contact_preferences FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON contact_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON contact_preferences FOR UPDATE USING (true);

-- Contact History policies
DROP POLICY IF EXISTS "Enable read access for all users" ON contact_history;
DROP POLICY IF EXISTS "Enable insert access for all users" ON contact_history;
DROP POLICY IF EXISTS "Enable update access for all users" ON contact_history;

CREATE POLICY "Enable read access for all users" ON contact_history FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON contact_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON contact_history FOR UPDATE USING (true);

-- Contact Methods policies
DROP POLICY IF EXISTS "Enable read access for all users" ON contact_methods;
DROP POLICY IF EXISTS "Enable insert access for all users" ON contact_methods;
DROP POLICY IF EXISTS "Enable update access for all users" ON contact_methods;

CREATE POLICY "Enable read access for all users" ON contact_methods FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON contact_methods FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON contact_methods FOR UPDATE USING (true);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Contact Preferences trigger
CREATE OR REPLACE FUNCTION update_contact_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_contact_preferences_updated_at ON contact_preferences;

CREATE TRIGGER trigger_update_contact_preferences_updated_at
    BEFORE UPDATE ON contact_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_preferences_updated_at();

-- Contact Methods trigger
CREATE OR REPLACE FUNCTION update_contact_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_contact_methods_updated_at ON contact_methods;

CREATE TRIGGER trigger_update_contact_methods_updated_at
    BEFORE UPDATE ON contact_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_methods_updated_at();

-- =====================================================
-- CREATE FUNCTIONS FOR AUTOMATIC SYNC
-- =====================================================

-- Function to automatically sync phone and WhatsApp numbers
CREATE OR REPLACE FUNCTION sync_contact_numbers()
RETURNS TRIGGER AS $$
BEGIN
    -- If phone is updated and WhatsApp is empty, copy phone to WhatsApp
    IF NEW.phone IS NOT NULL AND NEW.phone != '' AND (NEW.whatsapp IS NULL OR NEW.whatsapp = '') THEN
        NEW.whatsapp = NEW.phone;
    END IF;
    
    -- If WhatsApp is updated and phone is empty, copy WhatsApp to phone
    IF NEW.whatsapp IS NOT NULL AND NEW.whatsapp != '' AND (NEW.phone IS NULL OR NEW.phone = '') THEN
        NEW.phone = NEW.whatsapp;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on customers table
DROP TRIGGER IF EXISTS trigger_sync_contact_numbers ON customers;
CREATE TRIGGER trigger_sync_contact_numbers
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION sync_contact_numbers();

-- =====================================================
-- CREATE FUNCTION TO INITIALIZE CONTACT PREFERENCES
-- =====================================================

-- Function to create default contact preferences for new customers
CREATE OR REPLACE FUNCTION initialize_contact_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO contact_preferences (customer_id, preferred_method, whatsapp_enabled, sms_enabled, phone_call_enabled)
    VALUES (NEW.id, 'whatsapp', true, true, true)
    ON CONFLICT (customer_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on customers table
DROP TRIGGER IF EXISTS trigger_initialize_contact_preferences ON customers;
CREATE TRIGGER trigger_initialize_contact_preferences
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION initialize_contact_preferences();

-- =====================================================
-- CREATE FUNCTION TO UPDATE CONTACT METHODS
-- =====================================================

-- Function to update contact methods when customer data changes
CREATE OR REPLACE FUNCTION update_contact_methods()
RETURNS TRIGGER AS $$
BEGIN
    -- Clear existing methods for this customer
    DELETE FROM contact_methods WHERE customer_id = NEW.id;
    
    -- Add WhatsApp method if available
    IF NEW.whatsapp IS NOT NULL AND NEW.whatsapp != '' THEN
        INSERT INTO contact_methods (customer_id, method_type, phone_number, is_available, is_preferred)
        VALUES (NEW.id, 'whatsapp', NEW.whatsapp, true, true);
    END IF;
    
    -- Add SMS method if phone is available
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        INSERT INTO contact_methods (customer_id, method_type, phone_number, is_available, is_preferred)
        VALUES (NEW.id, 'sms', NEW.phone, true, false);
        
        -- Add phone call method
        INSERT INTO contact_methods (customer_id, method_type, phone_number, is_available, is_preferred)
        VALUES (NEW.id, 'phone_call', NEW.phone, true, false);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on customers table
DROP TRIGGER IF EXISTS trigger_update_contact_methods ON customers;
CREATE TRIGGER trigger_update_contact_methods
    AFTER INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_methods();

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE contact_preferences IS 'Stores customer contact preferences and settings';
COMMENT ON TABLE contact_history IS 'Stores history of all contact attempts (messages, calls)';
COMMENT ON TABLE contact_methods IS 'Stores available contact methods for each customer';

COMMENT ON COLUMN contact_preferences.preferred_method IS 'Customer preferred contact method (whatsapp, sms, phone_call)';
COMMENT ON COLUMN contact_preferences.quiet_hours IS 'JSON object with quiet hours settings';
COMMENT ON COLUMN contact_history.method IS 'Contact method used (whatsapp, sms, phone_call)';
COMMENT ON COLUMN contact_history.type IS 'Type of contact (message, call)';
COMMENT ON COLUMN contact_history.status IS 'Status of the contact attempt';
COMMENT ON COLUMN contact_methods.verification_status IS 'Status of method verification (verified, unverified, unknown, failed)';
