-- Fix Settings Table RLS Policies
-- This migration fixes the Row Level Security policies for the settings table
-- to allow authenticated users to manage settings, not just admin users

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow admin users to manage settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage settings" ON settings;

-- Create new permissive policy for authenticated users
CREATE POLICY "Allow authenticated users to manage settings" 
ON settings FOR ALL 
TO authenticated 
USING (true);

-- Create admin policy as a backup (optional)
CREATE POLICY "Allow admin users to manage settings" 
ON settings FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Verify policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'settings';
