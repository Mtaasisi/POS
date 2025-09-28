-- Create device_attachments table to fix 500 error in DeviceDetailPage
-- Migration: 20250131000070_create_device_attachments_table.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create device_attachments table
CREATE TABLE IF NOT EXISTS device_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT DEFAULT 'other',
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_attachments_device_id ON device_attachments(device_id);
CREATE INDEX IF NOT EXISTS idx_device_attachments_uploaded_by ON device_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_device_attachments_created_at ON device_attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_device_attachments_file_type ON device_attachments(file_type);

-- Enable Row Level Security
ALTER TABLE device_attachments ENABLE ROW LEVEL SECURITY;

-- Create policy for device_attachments
CREATE POLICY "Enable all access for authenticated users" ON device_attachments
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON device_attachments TO authenticated;
GRANT ALL ON device_attachments TO anon;

-- Create storage bucket for device attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-attachments', 'device-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for device attachments
CREATE POLICY "Allow authenticated users to upload device attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'device-attachments' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to view device attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'device-attachments' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to delete device attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'device-attachments' 
        AND auth.role() = 'authenticated'
    );
