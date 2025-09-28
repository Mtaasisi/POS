-- Fix automation_rules table permissions for frontend access
-- This will allow authenticated users to see all automation rules

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can insert automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can update automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can delete automation rules" ON automation_rules;

-- Create permissive policies that allow authenticated users to access all automation rules
CREATE POLICY "Authenticated users can view all automation rules" ON automation_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert automation rules" ON automation_rules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update automation rules" ON automation_rules
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete automation rules" ON automation_rules
    FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you want to allow anonymous access (less secure but simpler)
-- DROP POLICY IF EXISTS "Authenticated users can view all automation rules" ON automation_rules;
-- CREATE POLICY "Allow anonymous access to automation rules" ON automation_rules
--     FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_rules TO anon;

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'automation_rules';
