-- Create diagnostic_templates table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.diagnostic_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_type TEXT NOT NULL,
    checklist_items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default diagnostic templates
INSERT INTO diagnostic_templates (device_type, checklist_items) VALUES
('Laptop', '[
    {"id": "1", "name": "Power On Test", "description": "Check if device powers on"},
    {"id": "2", "name": "Display Test", "description": "Check screen functionality"},
    {"id": "3", "name": "Keyboard Test", "description": "Test all keyboard keys"},
    {"id": "4", "name": "Touchpad Test", "description": "Test touchpad functionality"},
    {"id": "5", "name": "Audio Test", "description": "Test speakers and microphone"},
    {"id": "6", "name": "USB Ports Test", "description": "Test all USB ports"},
    {"id": "7", "name": "WiFi Test", "description": "Test wireless connectivity"},
    {"id": "8", "name": "Battery Test", "description": "Check battery health"}
]'),
('Phone', '[
    {"id": "1", "name": "Power On Test", "description": "Check if device powers on"},
    {"id": "2", "name": "Display Test", "description": "Check screen and touch functionality"},
    {"id": "3", "name": "Camera Test", "description": "Test front and back cameras"},
    {"id": "4", "name": "Audio Test", "description": "Test speakers and microphone"},
    {"id": "5", "name": "Charging Test", "description": "Test charging port"},
    {"id": "6", "name": "SIM Card Test", "description": "Test SIM card functionality"},
    {"id": "7", "name": "WiFi Test", "description": "Test wireless connectivity"},
    {"id": "8", "name": "Battery Test", "description": "Check battery health"}
]'),
('Tablet', '[
    {"id": "1", "name": "Power On Test", "description": "Check if device powers on"},
    {"id": "2", "name": "Display Test", "description": "Check screen and touch functionality"},
    {"id": "3", "name": "Camera Test", "description": "Test front and back cameras"},
    {"id": "4", "name": "Audio Test", "description": "Test speakers and microphone"},
    {"id": "5", "name": "Charging Test", "description": "Test charging port"},
    {"id": "6", "name": "WiFi Test", "description": "Test wireless connectivity"},
    {"id": "7", "name": "Battery Test", "description": "Check battery health"}
]');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_templates_device_type ON diagnostic_templates(device_type);

-- Enable RLS
ALTER TABLE diagnostic_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
DROP POLICY IF EXISTS "Users can view diagnostic templates" ON diagnostic_templates;
CREATE POLICY "Users can view diagnostic templates" ON diagnostic_templates
    FOR SELECT USING (true);

-- Verify the table was created
SELECT COUNT(*) as template_count FROM diagnostic_templates; 