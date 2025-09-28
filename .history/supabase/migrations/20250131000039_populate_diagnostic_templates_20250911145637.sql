-- Populate diagnostic_templates table with standard diagnostic checklists
-- Migration: 20250131000039_populate_diagnostic_templates.sql

-- First, clean up any existing duplicates by keeping only the latest entry for each device_type
DELETE FROM diagnostic_templates 
WHERE id NOT IN (
  SELECT DISTINCT ON (device_type) id 
  FROM diagnostic_templates 
  ORDER BY device_type, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE diagnostic_templates ADD CONSTRAINT unique_device_type UNIQUE (device_type);

-- Insert diagnostic templates for different device types
INSERT INTO diagnostic_templates (device_type, checklist_items) VALUES
-- General device template (base diagnostics)
('general', '[
  {
    "id": "power-test",
    "title": "Power Test",
    "description": "Check if device powers on and boots properly",
    "category": "hardware",
    "required": true
  },
  {
    "id": "display-test", 
    "title": "Display Test",
    "description": "Check screen for dead pixels, brightness, and touch response",
    "category": "hardware",
    "required": true
  },
  {
    "id": "camera-test",
    "title": "Camera Test", 
    "description": "Test front and back cameras for functionality and quality",
    "category": "hardware",
    "required": true
  },
  {
    "id": "audio-test",
    "title": "Audio Test",
    "description": "Test speakers, microphone, and headphone jack", 
    "category": "hardware",
    "required": true
  },
  {
    "id": "storage-test",
    "title": "Storage Test",
    "description": "Check internal storage and SD card functionality",
    "category": "hardware", 
    "required": true
  },
  {
    "id": "performance-test",
    "title": "Performance Test",
    "description": "Test CPU, RAM, and overall system performance",
    "category": "performance",
    "required": true
  },
  {
    "id": "wifi-test",
    "title": "WiFi Test", 
    "description": "Test WiFi connectivity and signal strength",
    "category": "connectivity",
    "required": true
  },
  {
    "id": "software-test",
    "title": "Software Test",
    "description": "Check operating system and installed applications",
    "category": "software",
    "required": true
  }
]'::jsonb),

-- Laptop specific template
('laptop', '[
  {
    "id": "power-test",
    "title": "Power Test",
    "description": "Check if device powers on and boots properly",
    "category": "hardware",
    "required": true
  },
  {
    "id": "display-test",
    "title": "Display Test", 
    "description": "Check screen for dead pixels, brightness, and touch response",
    "category": "hardware",
    "required": true
  },
  {
    "id": "camera-test",
    "title": "Camera Test",
    "description": "Test front and back cameras for functionality and quality", 
    "category": "hardware",
    "required": true
  },
  {
    "id": "audio-test",
    "title": "Audio Test",
    "description": "Test speakers, microphone, and headphone jack",
    "category": "hardware",
    "required": true
  },
  {
    "id": "storage-test",
    "title": "Storage Test",
    "description": "Check internal storage and SD card functionality",
    "category": "hardware",
    "required": true
  },
  {
    "id": "performance-test", 
    "title": "Performance Test",
    "description": "Test CPU, RAM, and overall system performance",
    "category": "performance",
    "required": true
  },
  {
    "id": "wifi-test",
    "title": "WiFi Test",
    "description": "Test WiFi connectivity and signal strength",
    "category": "connectivity", 
    "required": true
  },
  {
    "id": "software-test",
    "title": "Software Test",
    "description": "Check operating system and installed applications",
    "category": "software",
    "required": true
  },
  {
    "id": "keyboard-test",
    "title": "Keyboard Test",
    "description": "Test all keys and keyboard backlight",
    "category": "hardware",
    "required": true
  },
  {
    "id": "touchpad-test",
    "title": "Touchpad Test", 
    "description": "Test touchpad sensitivity and gestures",
    "category": "hardware",
    "required": true
  }
]'::jsonb),

-- Phone/Mobile specific template
('phone', '[
  {
    "id": "power-test",
    "title": "Power Test",
    "description": "Check if device powers on and boots properly",
    "category": "hardware",
    "required": true
  },
  {
    "id": "display-test",
    "title": "Display Test",
    "description": "Check screen for dead pixels, brightness, and touch response", 
    "category": "hardware",
    "required": true
  },
  {
    "id": "camera-test",
    "title": "Camera Test",
    "description": "Test front and back cameras for functionality and quality",
    "category": "hardware",
    "required": true
  },
  {
    "id": "audio-test",
    "title": "Audio Test",
    "description": "Test speakers, microphone, and headphone jack",
    "category": "hardware",
    "required": true
  },
  {
    "id": "storage-test",
    "title": "Storage Test", 
    "description": "Check internal storage and SD card functionality",
    "category": "hardware",
    "required": true
  },
  {
    "id": "performance-test",
    "title": "Performance Test",
    "description": "Test CPU, RAM, and overall system performance",
    "category": "performance",
    "required": true
  },
  {
    "id": "wifi-test",
    "title": "WiFi Test",
    "description": "Test WiFi connectivity and signal strength",
    "category": "connectivity",
    "required": true
  },
  {
    "id": "software-test",
    "title": "Software Test",
    "description": "Check operating system and installed applications",
    "category": "software", 
    "required": true
  },
  {
    "id": "touch-test",
    "title": "Touch Screen Test",
    "description": "Test touch screen responsiveness and accuracy",
    "category": "hardware",
    "required": true
  },
  {
    "id": "sim-test",
    "title": "SIM Card Test",
    "description": "Test SIM card detection and cellular connectivity",
    "category": "connectivity",
    "required": true
  }
]'::jsonb),

-- Mobile specific template (alias for phone)
('mobile', '[
  {
    "id": "power-test",
    "title": "Power Test",
    "description": "Check if device powers on and boots properly",
    "category": "hardware",
    "required": true
  },
  {
    "id": "display-test",
    "title": "Display Test",
    "description": "Check screen for dead pixels, brightness, and touch response",
    "category": "hardware", 
    "required": true
  },
  {
    "id": "camera-test",
    "title": "Camera Test",
    "description": "Test front and back cameras for functionality and quality",
    "category": "hardware",
    "required": true
  },
  {
    "id": "audio-test",
    "title": "Audio Test",
    "description": "Test speakers, microphone, and headphone jack",
    "category": "hardware",
    "required": true
  },
  {
    "id": "storage-test",
    "title": "Storage Test",
    "description": "Check internal storage and SD card functionality",
    "category": "hardware",
    "required": true
  },
  {
    "id": "performance-test",
    "title": "Performance Test",
    "description": "Test CPU, RAM, and overall system performance",
    "category": "performance",
    "required": true
  },
  {
    "id": "wifi-test",
    "title": "WiFi Test",
    "description": "Test WiFi connectivity and signal strength",
    "category": "connectivity",
    "required": true
  },
  {
    "id": "software-test",
    "title": "Software Test",
    "description": "Check operating system and installed applications",
    "category": "software",
    "required": true
  },
  {
    "id": "touch-test",
    "title": "Touch Screen Test",
    "description": "Test touch screen responsiveness and accuracy",
    "category": "hardware",
    "required": true
  },
  {
    "id": "sim-test",
    "title": "SIM Card Test",
    "description": "Test SIM card detection and cellular connectivity",
    "category": "connectivity",
    "required": true
  }
]'::jsonb)

ON CONFLICT (device_type) DO UPDATE SET
  checklist_items = EXCLUDED.checklist_items,
  updated_at = NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_templates_device_type ON diagnostic_templates(device_type);

-- Add comments for documentation
COMMENT ON TABLE diagnostic_templates IS 'Stores diagnostic checklist templates for different device types';
COMMENT ON COLUMN diagnostic_templates.device_type IS 'Type of device (general, laptop, phone, mobile, etc.)';
COMMENT ON COLUMN diagnostic_templates.checklist_items IS 'JSON array of diagnostic checklist items with id, title, description, category, and required fields';
