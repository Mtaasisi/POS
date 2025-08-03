-- Fix device_checklists table structure to match TypeScript types
-- TypeScript expects: completed_by, completed_at
-- Current table has: assigned_to, started_at, completed_at, notes

-- Add missing column
ALTER TABLE device_checklists ADD COLUMN IF NOT EXISTS completed_by TEXT;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'device_checklists'
    AND column_name IN ('completed_by', 'completed_at')
ORDER BY column_name; 