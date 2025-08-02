-- Fix RLS Policies for Spare Parts
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON spare_parts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON spare_parts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON spare_parts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON spare_parts;

DROP POLICY IF EXISTS "Enable read access for all users" ON spare_parts_usage;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON spare_parts_usage;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON spare_parts_usage;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON spare_parts_usage;

-- Create new policies that allow anonymous read access
CREATE POLICY "Enable read access for all users" ON spare_parts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON spare_parts_usage FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts_usage FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts_usage FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts_usage FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('spare_parts', 'spare_parts_usage')
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS policies updated successfully!' as status; 