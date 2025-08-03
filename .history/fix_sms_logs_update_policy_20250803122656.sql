-- Fix SMS Logs Update Policy
-- Add missing UPDATE policy for sms_logs table

-- Add UPDATE policy for sms_logs
CREATE POLICY "Users can update SMS logs" ON sms_logs
FOR UPDATE USING (true)
WITH CHECK (true);

-- Verify all policies
SELECT 
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'sms_logs'
ORDER BY policyname; 