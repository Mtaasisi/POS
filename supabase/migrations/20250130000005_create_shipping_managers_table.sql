-- Create Shipping Managers Table
-- This migration ensures the lats_shipping_managers table exists

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
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shipping_managers_business_id ON lats_shipping_managers(business_id);
CREATE INDEX IF NOT EXISTS idx_shipping_managers_user_id ON lats_shipping_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_managers_is_active ON lats_shipping_managers(is_active);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
ALTER TABLE lats_shipping_managers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own business managers" ON lats_shipping_managers;
DROP POLICY IF EXISTS "Users can manage own business managers" ON lats_shipping_managers;

-- Create new policies
CREATE POLICY "Users can read own business managers" ON lats_shipping_managers FOR SELECT USING (
    business_id IN (SELECT id FROM lats_businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage own business managers" ON lats_shipping_managers FOR ALL USING (
    user_id = auth.uid() OR business_id IN (SELECT id FROM lats_businesses WHERE user_id = auth.uid())
);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_shipping_managers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_shipping_managers_updated_at ON lats_shipping_managers;

-- Create new trigger
CREATE TRIGGER update_shipping_managers_updated_at
    BEFORE UPDATE ON lats_shipping_managers
    FOR EACH ROW EXECUTE FUNCTION update_shipping_managers_updated_at();

-- =====================================================
-- INSERT SAMPLE DATA (Optional)
-- =====================================================
-- Insert a default shipping manager if none exist
INSERT INTO lats_shipping_managers (name, email, department, is_active)
SELECT 'Default Logistics Manager', 'logistics@company.com', 'Logistics', true
WHERE NOT EXISTS (SELECT 1 FROM lats_shipping_managers LIMIT 1);
