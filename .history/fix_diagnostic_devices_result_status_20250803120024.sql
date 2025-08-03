-- Fix diagnostic_devices table - Add missing result_status column
-- Run this to add the result_status column that your app expects

-- Add the result_status column to diagnostic_devices table
ALTER TABLE diagnostic_devices 
ADD COLUMN IF NOT EXISTS result_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (result_status IN ('pending', 'passed', 'failed', 'partially_failed', 'submitted_for_review', 'repair_required', 'replacement_required', 'no_action_required', 'escalated', 'admin_reviewed', 'sent_to_care'));

-- Update existing records to have a proper result_status based on their current status
UPDATE diagnostic_devices 
SET result_status = 
    CASE 
        WHEN status = 'completed' THEN 'passed'
        WHEN status = 'failed' THEN 'failed'
        WHEN status = 'in_progress' THEN 'pending'
        WHEN status = 'pending' THEN 'pending'
        ELSE 'pending'
    END
WHERE result_status IS NULL OR result_status = 'pending';

-- Create index for result_status column for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_result_status ON diagnostic_devices(result_status);

-- Add other missing columns that your app expects
ALTER TABLE diagnostic_devices 
ADD COLUMN IF NOT EXISTS device_name TEXT,
ADD COLUMN IF NOT EXISTS serial_number TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
ADD COLUMN IF NOT EXISTS next_action TEXT CHECK (next_action IN ('repair', 'replace', 'ignore', 'escalate')),
ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS feedback_submitted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS repair_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS repair_notes TEXT,
ADD COLUMN IF NOT EXISTS parts_used TEXT,
ADD COLUMN IF NOT EXISTS repair_time TEXT;

-- Update device_name from device_id if possible
UPDATE diagnostic_devices 
SET device_name = (
    SELECT CONCAT(brand, ' ', model) 
    FROM devices 
    WHERE devices.id = diagnostic_devices.device_id
)
WHERE device_name IS NULL AND device_id IS NOT NULL;

-- Success message
SELECT 'diagnostic_devices table updated successfully! Added result_status column and other missing columns.' as status; 