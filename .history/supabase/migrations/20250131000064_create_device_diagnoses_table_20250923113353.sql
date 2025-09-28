-- Create device_diagnoses table for storing device diagnosis results
-- Migration: 20250131000064_create_device_diagnoses_table.sql
-- NOTE: This table is DEPRECATED - now using diagnostic_checklist_results table instead
-- This table was previously used by DiagnosisModal.tsx (now removed)

CREATE TABLE IF NOT EXISTS device_diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    diagnosis_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_diagnoses_device_id ON device_diagnoses(device_id);
CREATE INDEX IF NOT EXISTS idx_device_diagnoses_technician_id ON device_diagnoses(technician_id);
CREATE INDEX IF NOT EXISTS idx_device_diagnoses_status ON device_diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_device_diagnoses_created_at ON device_diagnoses(created_at);

-- Enable Row Level Security
ALTER TABLE device_diagnoses ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON device_diagnoses
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON device_diagnoses TO authenticated;
GRANT ALL ON device_diagnoses TO service_role;

-- Create trigger for updating timestamps (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_device_diagnoses_updated_at 
            BEFORE UPDATE ON device_diagnoses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE device_diagnoses IS 'DEPRECATED: Was used by DiagnosisModal.tsx (now removed). Use diagnostic_checklist_results instead.';
COMMENT ON COLUMN device_diagnoses.device_id IS 'Reference to the device being diagnosed';
COMMENT ON COLUMN device_diagnoses.technician_id IS 'Technician who performed the diagnosis';
COMMENT ON COLUMN device_diagnoses.diagnosis_data IS 'JSON data containing diagnosis steps, results, and metadata';
COMMENT ON COLUMN device_diagnoses.status IS 'Status of the diagnosis process';
