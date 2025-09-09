-- Migration: Fix RLS policies for shipping assignment
-- This migration creates proper RLS policies for shipping-related tables

-- Enable RLS on shipping tables if not already enabled
ALTER TABLE lats_shipping_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_shipping_managers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_shipping_info;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lats_shipping_info;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON lats_shipping_info;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON lats_shipping_info;

DROP POLICY IF EXISTS "Enable read access for all users" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON lats_shipping_agents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON lats_shipping_agents;

DROP POLICY IF EXISTS "Enable read access for all users" ON lats_shipping_carriers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lats_shipping_carriers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON lats_shipping_carriers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON lats_shipping_carriers;

DROP POLICY IF EXISTS "Enable read access for all users" ON lats_shipping_managers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lats_shipping_managers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON lats_shipping_managers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON lats_shipping_managers;

-- Create policies for lats_shipping_info
CREATE POLICY "Enable read access for all users" ON lats_shipping_info
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON lats_shipping_info
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON lats_shipping_info
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON lats_shipping_info
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for lats_shipping_agents
CREATE POLICY "Enable read access for all users" ON lats_shipping_agents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON lats_shipping_agents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON lats_shipping_agents
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON lats_shipping_agents
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for lats_shipping_carriers
CREATE POLICY "Enable read access for all users" ON lats_shipping_carriers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON lats_shipping_carriers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON lats_shipping_carriers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON lats_shipping_carriers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for lats_shipping_managers
CREATE POLICY "Enable read access for all users" ON lats_shipping_managers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON lats_shipping_managers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON lats_shipping_managers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON lats_shipping_managers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON POLICY "Enable read access for all users" ON lats_shipping_info IS 'Allow all users to read shipping info';
COMMENT ON POLICY "Enable insert for authenticated users" ON lats_shipping_info IS 'Allow authenticated users to create shipping info';
COMMENT ON POLICY "Enable update for authenticated users" ON lats_shipping_info IS 'Allow authenticated users to update shipping info';
COMMENT ON POLICY "Enable delete for authenticated users" ON lats_shipping_info IS 'Allow authenticated users to delete shipping info';
