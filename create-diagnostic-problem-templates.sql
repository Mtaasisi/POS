-- Create diagnostic problem templates and checklist system
-- This migration creates tables for managing diagnostic checklists by problem type
-- Used by DiagnosticChecklistModal.tsx for consistent diagnostic workflow

-- Create diagnostic_problem_templates table
CREATE TABLE IF NOT EXISTS diagnostic_problem_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_name TEXT NOT NULL UNIQUE,
    problem_description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    checklist_items JSONB NOT NULL DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create diagnostic_checklist_results table
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
CREATE INDEX IF NOT EXISTS idx_diagnostic_problem_templates_category ON diagnostic_problem_templates(category);
CREATE INDEX IF NOT EXISTS idx_diagnostic_problem_templates_created_by ON diagnostic_problem_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_diagnostic_problem_templates_is_active ON diagnostic_problem_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_device_id ON diagnostic_checklist_results(device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_template_id ON diagnostic_checklist_results(problem_template_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_status ON diagnostic_checklist_results(overall_status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_results_completed_by ON diagnostic_checklist_results(completed_by);

-- Enable Row Level Security
ALTER TABLE diagnostic_problem_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_checklist_results ENABLE ROW LEVEL SECURITY;

-- Create policies for diagnostic_problem_templates
CREATE POLICY "Enable all access for authenticated users" ON diagnostic_problem_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for diagnostic_checklist_results
CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checklist_results
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON diagnostic_problem_templates TO authenticated;
GRANT ALL ON diagnostic_checklist_results TO authenticated;

-- Insert some default problem templates
INSERT INTO diagnostic_problem_templates (problem_name, problem_description, category, checklist_items, created_by) VALUES
(
    'Phone No Power',
    'Device does not turn on or charge',
    'power',
    '[
        {"id": "power_button", "title": "Check Power Button", "description": "Test if power button is responsive", "required": true},
        {"id": "charging_port", "title": "Check Charging Port", "description": "Inspect charging port for damage or debris", "required": true},
        {"id": "battery_connection", "title": "Check Battery Connection", "description": "Verify battery is properly connected", "required": true},
        {"id": "charging_cable", "title": "Test Charging Cable", "description": "Test with known working charging cable", "required": true},
        {"id": "power_adapter", "title": "Test Power Adapter", "description": "Test with known working power adapter", "required": true},
        {"id": "water_damage", "title": "Check for Water Damage", "description": "Look for signs of water damage or corrosion", "required": false},
        {"id": "motherboard", "title": "Check Motherboard", "description": "Inspect motherboard for visible damage", "required": false}
    ]',
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
),
(
    'Screen Issues',
    'Display problems, touch issues, or screen damage',
    'display',
    '[
        {"id": "screen_damage", "title": "Check Screen Damage", "description": "Look for cracks, scratches, or physical damage", "required": true},
        {"id": "touch_responsiveness", "title": "Test Touch Responsiveness", "description": "Test touch functionality across the screen", "required": true},
        {"id": "display_quality", "title": "Check Display Quality", "description": "Look for dead pixels, lines, or discoloration", "required": true},
        {"id": "brightness_control", "title": "Test Brightness Control", "description": "Test if brightness adjustment works", "required": true},
        {"id": "screen_connection", "title": "Check Screen Connection", "description": "Verify screen ribbon cable connection", "required": false},
        {"id": "backlight", "title": "Check Backlight", "description": "Test if backlight is working properly", "required": false}
    ]',
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
),
(
    'Audio Problems',
    'Speaker, microphone, or audio output issues',
    'audio',
    '[
        {"id": "speaker_test", "title": "Test Speaker", "description": "Play audio to test speaker functionality", "required": true},
        {"id": "microphone_test", "title": "Test Microphone", "description": "Record audio to test microphone", "required": true},
        {"id": "headphone_jack", "title": "Test Headphone Jack", "description": "Test audio output through headphone jack", "required": true},
        {"id": "bluetooth_audio", "title": "Test Bluetooth Audio", "description": "Test audio through Bluetooth devices", "required": false},
        {"id": "volume_control", "title": "Test Volume Control", "description": "Test volume up/down buttons", "required": true},
        {"id": "audio_settings", "title": "Check Audio Settings", "description": "Verify audio settings are correct", "required": false}
    ]',
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
),
(
    'Camera Issues',
    'Front or rear camera problems',
    'camera',
    '[
        {"id": "rear_camera", "title": "Test Rear Camera", "description": "Take photos and videos with rear camera", "required": true},
        {"id": "front_camera", "title": "Test Front Camera", "description": "Take photos and videos with front camera", "required": true},
        {"id": "camera_focus", "title": "Test Camera Focus", "description": "Test autofocus functionality", "required": true},
        {"id": "flash", "title": "Test Flash", "description": "Test camera flash functionality", "required": true},
        {"id": "camera_app", "title": "Test Camera App", "description": "Test if camera app opens and functions", "required": true},
        {"id": "camera_switching", "title": "Test Camera Switching", "description": "Test switching between front and rear cameras", "required": false}
    ]',
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
),
(
    'Network Issues',
    'WiFi, cellular, or connectivity problems',
    'network',
    '[
        {"id": "wifi_connection", "title": "Test WiFi Connection", "description": "Connect to WiFi and test internet access", "required": true},
        {"id": "cellular_signal", "title": "Test Cellular Signal", "description": "Check cellular signal strength and connectivity", "required": true},
        {"id": "bluetooth", "title": "Test Bluetooth", "description": "Test Bluetooth connectivity and pairing", "required": true},
        {"id": "gps", "title": "Test GPS", "description": "Test GPS location services", "required": false},
        {"id": "hotspot", "title": "Test Mobile Hotspot", "description": "Test mobile hotspot functionality", "required": false},
        {"id": "network_settings", "title": "Check Network Settings", "description": "Verify network settings are correct", "required": false}
    ]',
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
);

-- Add comments for documentation
COMMENT ON TABLE diagnostic_problem_templates IS 'Templates for diagnostic checklists based on common device problems';
COMMENT ON TABLE diagnostic_checklist_results IS 'Results of diagnostic checklists performed on devices';
COMMENT ON COLUMN diagnostic_problem_templates.checklist_items IS 'JSON array of checklist items with id, title, description, and required fields';
COMMENT ON COLUMN diagnostic_checklist_results.checklist_items IS 'JSON array of completed checklist items with results and notes';
