-- Create device work sessions table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS device_work_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id UUID NOT NULL,
    technician_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_work_sessions_device_id ON device_work_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_work_sessions_technician_id ON device_work_sessions(technician_id);
CREATE INDEX IF NOT EXISTS idx_device_work_sessions_start_time ON device_work_sessions(start_time);

ALTER TABLE device_work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON device_work_sessions
    FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON device_work_sessions TO authenticated;
