-- Create device work sessions table for technician time tracking
-- Migration: 20250131000032_create_device_work_sessions_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Device work sessions table
CREATE TABLE IF NOT EXISTS device_work_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_work_sessions_device_id ON device_work_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_work_sessions_technician_id ON device_work_sessions(technician_id);
CREATE INDEX IF NOT EXISTS idx_device_work_sessions_start_time ON device_work_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_device_work_sessions_status ON device_work_sessions(status);

-- Enable Row Level Security
ALTER TABLE device_work_sessions ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON device_work_sessions
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON device_work_sessions TO authenticated;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_device_work_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_work_sessions_updated_at
    BEFORE UPDATE ON device_work_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_device_work_sessions_updated_at();

-- Add comments
COMMENT ON TABLE device_work_sessions IS 'Tracks technician work sessions on devices for time management and productivity monitoring';
COMMENT ON COLUMN device_work_sessions.device_id IS 'Reference to the device being worked on';
COMMENT ON COLUMN device_work_sessions.technician_id IS 'Reference to the technician performing the work';
COMMENT ON COLUMN device_work_sessions.start_time IS 'When the work session started';
COMMENT ON COLUMN device_work_sessions.end_time IS 'When the work session ended (null for active sessions)';
COMMENT ON COLUMN device_work_sessions.duration_minutes IS 'Calculated duration in minutes';
COMMENT ON COLUMN device_work_sessions.status IS 'Current status of the work session';
COMMENT ON COLUMN device_work_sessions.notes IS 'Optional notes about the work session';
