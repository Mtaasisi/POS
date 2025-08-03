-- Fix SMS Logs RLS Policies
-- Run this in your Supabase SQL Editor

-- First, check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sms_logs';

-- Enable RLS on sms_logs table if not already enabled
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON sms_logs;
DROP POLICY IF EXISTS "Allow all operations for service role" ON sms_logs;
DROP POLICY IF EXISTS "Allow all operations for anon" ON sms_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON sms_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sms_logs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON sms_logs;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON sms_logs;

-- Create new policies
-- Policy for authenticated users (all operations)
CREATE POLICY "Allow all operations for authenticated users" ON sms_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Policy for service role (all operations)
CREATE POLICY "Allow all operations for service role" ON sms_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for anon users (for testing and public access)
CREATE POLICY "Allow all operations for anon" ON sms_logs
  FOR ALL USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'sms_logs';

-- Test insert (this should work now)
-- INSERT INTO sms_logs (phone_number, message, status) 
-- VALUES ('+255700000000', 'Test SMS', 'pending'); 