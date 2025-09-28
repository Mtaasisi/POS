-- Fix repair_parts RLS policies
-- The current policies have syntax errors causing 403 Forbidden errors

-- First, let's check the current state
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'repair_parts';

-- Drop existing broken policies
DROP POLICY IF EXISTS "Users can view repair parts" ON repair_parts;
DROP POLICY IF EXISTS "Technicians and admins can manage repair parts" ON repair_parts;

-- Create corrected policies
-- Policy for authenticated users to view repair parts
CREATE POLICY "Users can view repair parts" ON repair_parts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for technicians and admins to manage repair parts (INSERT, UPDATE, DELETE)
CREATE POLICY "Technicians and admins can manage repair parts" ON repair_parts
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM auth_users 
                WHERE auth_users.id = auth.uid() 
                AND auth_users.role IN ('technician', 'admin')
            )
        )
    );

-- Also create a more permissive policy for authenticated users to insert/update
-- This allows the frontend to create repair parts when needed
CREATE POLICY "Authenticated users can insert repair parts" ON repair_parts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update repair parts" ON repair_parts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Verify the policies were created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'repair_parts'
ORDER BY policyname;
