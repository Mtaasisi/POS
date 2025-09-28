-- Create diagnostic_problem_templates table
-- This table stores reusable diagnostic problem templates for device repair

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create diagnostic_problem_templates table
CREATE TABLE IF NOT EXISTS diagnostic_problem_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_name TEXT NOT NULL UNIQUE,
    problem_description TEXT,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'general', 'power', 'display', 'audio', 'camera', 
        'network', 'hardware', 'software'
    )),
    checklist_items JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_problem_templates_category ON diagnostic_problem_templates(category);
CREATE INDEX IF NOT EXISTS idx_diagnostic_problem_templates_active ON diagnostic_problem_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_diagnostic_problem_templates_created_by ON diagnostic_problem_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_diagnostic_problem_templates_created_at ON diagnostic_problem_templates(created_at);

-- Enable Row Level Security
ALTER TABLE diagnostic_problem_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all authenticated users" ON diagnostic_problem_templates 
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON diagnostic_problem_templates 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON diagnostic_problem_templates 
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON diagnostic_problem_templates 
    FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON diagnostic_problem_templates TO authenticated;
GRANT ALL ON diagnostic_problem_templates TO anon;

-- Add comments for documentation
COMMENT ON TABLE diagnostic_problem_templates IS 'Stores reusable diagnostic problem templates for device repair';
COMMENT ON COLUMN diagnostic_problem_templates.problem_name IS 'Unique name of the diagnostic problem';
COMMENT ON COLUMN diagnostic_problem_templates.problem_description IS 'Detailed description of the problem and diagnostic approach';
COMMENT ON COLUMN diagnostic_problem_templates.category IS 'Category of the problem (general, power, display, etc.)';
COMMENT ON COLUMN diagnostic_problem_templates.checklist_items IS 'JSON array of checklist items with id, title, description, and required fields';
COMMENT ON COLUMN diagnostic_problem_templates.is_active IS 'Whether this template is active and available for use';
COMMENT ON COLUMN diagnostic_problem_templates.created_by IS 'User who created this template';

-- Insert some default templates
INSERT INTO diagnostic_problem_templates (problem_name, problem_description, category, checklist_items, created_by) VALUES
(
    'Phone No Power',
    'Device does not turn on or show any signs of life.',
    'power',
    '[
        {
            "id": "1",
            "title": "Check Power Button",
            "description": "Verify if the power button is physically working and responsive.",
            "required": true
        },
        {
            "id": "2", 
            "title": "Check Charging Port",
            "description": "Inspect charging port for debris, damage, or loose connection. Test with known good charger.",
            "required": true
        },
        {
            "id": "3",
            "title": "Test with Known Good Battery", 
            "description": "If possible, test with a known good battery to rule out battery failure.",
            "required": true
        },
        {
            "id": "4",
            "title": "Check for Water Damage Indicators",
            "description": "Inspect LCI (Liquid Contact Indicators) and internal components for signs of water damage.",
            "required": true
        },
        {
            "id": "5",
            "title": "Perform Hard Reset/Force Restart",
            "description": "Attempt a hard reset or force restart sequence for the specific device model.",
            "required": true
        }
    ]'::jsonb,
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
),
(
    'Screen Issues',
    'Display problems including cracked screen, no display, or touch issues.',
    'display',
    '[
        {
            "id": "1",
            "title": "Visual Inspection",
            "description": "Check for physical damage, cracks, or discoloration on the screen.",
            "required": true
        },
        {
            "id": "2",
            "title": "Test Touch Functionality",
            "description": "Test touch response across different areas of the screen.",
            "required": true
        },
        {
            "id": "3",
            "title": "Check Display Connection",
            "description": "Inspect internal display cable connections if accessible.",
            "required": false
        },
        {
            "id": "4",
            "title": "Test with External Display",
            "description": "If possible, test with external display to isolate screen vs. device issues.",
            "required": false
        }
    ]'::jsonb,
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
),
(
    'Audio Problems',
    'Speaker, microphone, or headphone jack issues.',
    'audio',
    '[
        {
            "id": "1",
            "title": "Test Speaker Output",
            "description": "Play audio through device speakers and check for distortion or no sound.",
            "required": true
        },
        {
            "id": "2",
            "title": "Test Microphone",
            "description": "Record audio or make a test call to verify microphone functionality.",
            "required": true
        },
        {
            "id": "3",
            "title": "Check Headphone Jack",
            "description": "Test with known good headphones to verify jack functionality.",
            "required": true
        },
        {
            "id": "4",
            "title": "Check Audio Settings",
            "description": "Verify audio settings and volume levels are properly configured.",
            "required": true
        }
    ]'::jsonb,
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
),
(
    'Camera Issues',
    'Front or rear camera not working properly.',
    'camera',
    '[
        {
            "id": "1",
            "title": "Test Camera App",
            "description": "Open camera app and test both front and rear cameras.",
            "required": true
        },
        {
            "id": "2",
            "title": "Check Camera Permissions",
            "description": "Verify camera permissions are granted in device settings.",
            "required": true
        },
        {
            "id": "3",
            "title": "Test Camera Functions",
            "description": "Test photo capture, video recording, and flash functionality.",
            "required": true
        },
        {
            "id": "4",
            "title": "Check for Physical Damage",
            "description": "Inspect camera lens for scratches, cracks, or debris.",
            "required": true
        }
    ]'::jsonb,
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
),
(
    'Network Connectivity',
    'WiFi, cellular, or Bluetooth connection problems.',
    'network',
    '[
        {
            "id": "1",
            "title": "Test WiFi Connection",
            "description": "Connect to known good WiFi network and test internet access.",
            "required": true
        },
        {
            "id": "2",
            "title": "Test Cellular Data",
            "description": "Verify cellular data connection and signal strength.",
            "required": true
        },
        {
            "id": "3",
            "title": "Test Bluetooth",
            "description": "Pair with known good Bluetooth device and test functionality.",
            "required": true
        },
        {
            "id": "4",
            "title": "Check Network Settings",
            "description": "Verify network settings and reset if necessary.",
            "required": true
        }
    ]'::jsonb,
    (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (problem_name) DO NOTHING;
