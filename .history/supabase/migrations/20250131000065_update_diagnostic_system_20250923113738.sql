-- Update diagnostic system to use DiagnosticChecklistModal consistently
-- Migration: 20250131000065_update_diagnostic_system.sql
-- This migration ensures the diagnostic system is properly configured

-- Ensure diagnostic_checklist_results table exists and is properly configured
CREATE TABLE IF NOT EXISTS diagnostic_checklist_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    problem_template_id UUID REFERENCES diagnostic_problem_templates(id) ON DELETE SET NULL,
    checklist_items JSONB NOT NULL DEFAULT '[]',
    overall_status TEXT NOT NULL DEFAULT 'pending' CHECK (overall_status IN ('pending', 'in_progress', 'completed', 'failed')),
    technician_notes TEXT,
    completed_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_device_id ON diagnostic_checklist_results(device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_template_id ON diagnostic_checklist_results(problem_template_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_status ON diagnostic_checklist_results(overall_status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_completed_by ON diagnostic_checklist_results(completed_by);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_completed_at ON diagnostic_checklist_results(completed_at);

-- Enable Row Level Security
ALTER TABLE diagnostic_checklist_results ENABLE ROW LEVEL SECURITY;

-- Create policies for diagnostic_checklist_results
DO $$
BEGIN
    -- Check if policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_checklist_results' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        -- Create the policy only if it doesn't exist
        CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checklist_results
            FOR ALL USING (auth.role() = 'authenticated');
            
        RAISE NOTICE 'Created diagnostic_checklist_results policy';
    ELSE
        RAISE NOTICE 'diagnostic_checklist_results policy already exists, skipping';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'diagnostic_checklist_results policy already exists, continuing';
    WHEN OTHERS THEN
        RAISE NOTICE 'Policy creation failed: %', SQLERRM;
END $$;

-- Grant permissions
GRANT ALL ON diagnostic_checklist_results TO authenticated;
GRANT ALL ON diagnostic_checklist_results TO service_role;

-- Create trigger for updating timestamps (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_diagnostic_checklist_results_updated_at ON diagnostic_checklist_results;
        CREATE TRIGGER update_diagnostic_checklist_results_updated_at 
            BEFORE UPDATE ON diagnostic_checklist_results
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE diagnostic_checklist_results IS 'Stores diagnostic checklist results from DiagnosticChecklistModal';
COMMENT ON COLUMN diagnostic_checklist_results.device_id IS 'Reference to the device being diagnosed';
COMMENT ON COLUMN diagnostic_checklist_results.problem_template_id IS 'Reference to the diagnostic problem template used';
COMMENT ON COLUMN diagnostic_checklist_results.checklist_items IS 'JSON array of completed checklist items with results and notes';
COMMENT ON COLUMN diagnostic_checklist_results.overall_status IS 'Overall status of the diagnostic checklist';
COMMENT ON COLUMN diagnostic_checklist_results.technician_notes IS 'Additional notes from the technician';
COMMENT ON COLUMN diagnostic_checklist_results.completed_by IS 'Technician who completed the diagnostic checklist';

-- Update devices table to ensure diagnostic_checklist column exists
DO $$
BEGIN
    -- Add diagnostic_checklist column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devices' 
        AND column_name = 'diagnostic_checklist'
    ) THEN
        ALTER TABLE devices ADD COLUMN diagnostic_checklist JSONB;
    END IF;
    
    -- Add comment to the column
    COMMENT ON COLUMN devices.diagnostic_checklist IS 'Stores the latest diagnostic checklist results for the device';
END $$;

-- Create a view for easy access to diagnostic data
CREATE OR REPLACE VIEW device_diagnostic_summary AS
SELECT 
    d.id as device_id,
    d.brand,
    d.model,
    d.serial_number,
    d.status as device_status,
    dcr.id as diagnostic_result_id,
    dcr.overall_status as diagnostic_status,
    dcr.completed_at as diagnostic_completed_at,
    dcr.technician_notes,
    dpt.problem_name as diagnostic_template,
    dcr.checklist_items,
    au.name as completed_by_name
FROM devices d
LEFT JOIN diagnostic_checklist_results dcr ON d.id = dcr.device_id
LEFT JOIN diagnostic_problem_templates dpt ON dcr.problem_template_id = dpt.id
LEFT JOIN auth_users au ON dcr.completed_by = au.id
WHERE dcr.id IS NOT NULL
ORDER BY dcr.completed_at DESC;

-- Grant permissions on the view
GRANT SELECT ON device_diagnostic_summary TO authenticated;
GRANT SELECT ON device_diagnostic_summary TO service_role;

-- Add comment to the view
COMMENT ON VIEW device_diagnostic_summary IS 'Summary view of devices and their diagnostic results';

-- Optional: Migrate any existing data from device_diagnoses to diagnostic_checklist_results
-- (This is commented out as it may not be needed depending on your data)
/*
DO $$
BEGIN
    -- Only migrate if device_diagnoses table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'device_diagnoses') THEN
        INSERT INTO diagnostic_checklist_results (
            device_id,
            technician_id,
            checklist_items,
            overall_status,
            technician_notes,
            completed_at,
            created_at,
            updated_at
        )
        SELECT 
            device_id,
            technician_id,
            diagnosis_data,
            status,
            'Migrated from device_diagnoses table',
            created_at,
            created_at,
            updated_at
        FROM device_diagnoses
        WHERE NOT EXISTS (
            SELECT 1 FROM diagnostic_checklist_results 
            WHERE device_id = device_diagnoses.device_id
        );
        
        RAISE NOTICE 'Migrated % rows from device_diagnoses to diagnostic_checklist_results', 
            (SELECT COUNT(*) FROM device_diagnoses);
    END IF;
END $$;
*/
