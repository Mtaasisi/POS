-- Create diagnostic checklist tables
CREATE TABLE IF NOT EXISTS diagnostic_problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth_users(id)
);

CREATE TABLE IF NOT EXISTS diagnostic_checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID REFERENCES diagnostic_problems(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_diagnostic_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES diagnostic_problems(id),
  checklist_data JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default diagnostic problems and checklists
INSERT INTO diagnostic_problems (name, description, category) VALUES
('No Power', 'Device does not turn on or charge', 'Power Issues'),
('Screen Issues', 'Display problems, cracks, or touch issues', 'Display Issues'),
('Battery Problems', 'Battery not charging or draining quickly', 'Power Issues'),
('Audio Issues', 'Speaker, microphone, or audio problems', 'Audio Issues'),
('Camera Problems', 'Camera not working or poor quality', 'Camera Issues'),
('Network Issues', 'WiFi, Bluetooth, or cellular problems', 'Connectivity Issues'),
('Software Issues', 'Apps crashing, slow performance, or OS problems', 'Software Issues'),
('Physical Damage', 'Cracked screen, water damage, or other physical issues', 'Physical Damage');

-- Insert diagnostic checklist items for "No Power" problem
INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Check Power Button',
  'Verify power button is physically working and not stuck',
  1,
  true
FROM diagnostic_problems p WHERE p.name = 'No Power';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Test Charging Port',
  'Check if charging port is clean and charging cable works',
  2,
  true
FROM diagnostic_problems p WHERE p.name = 'No Power';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Check Battery Connection',
  'Open device and verify battery is properly connected',
  3,
  true
FROM diagnostic_problems p WHERE p.name = 'No Power';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Test with Different Charger',
  'Try charging with a different charger and cable',
  4,
  true
FROM diagnostic_problems p WHERE p.name = 'No Power';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Check for Water Damage',
  'Look for water damage indicators or corrosion',
  5,
  false
FROM diagnostic_problems p WHERE p.name = 'No Power';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Test Motherboard Power',
  'Use multimeter to test motherboard power supply',
  6,
  false
FROM diagnostic_problems p WHERE p.name = 'No Power';

-- Insert diagnostic checklist items for "Screen Issues" problem
INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Check Screen Display',
  'Verify if screen shows any image or is completely black',
  1,
  true
FROM diagnostic_problems p WHERE p.name = 'Screen Issues';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Test Touch Functionality',
  'Check if touch screen responds to finger input',
  2,
  true
FROM diagnostic_problems p WHERE p.name = 'Screen Issues';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Check for Physical Damage',
  'Look for cracks, scratches, or other physical damage',
  3,
  true
FROM diagnostic_problems p WHERE p.name = 'Screen Issues';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Test Screen Brightness',
  'Check if brightness controls work and screen is visible',
  4,
  true
FROM diagnostic_problems p WHERE p.name = 'Screen Issues';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Check Screen Connector',
  'Open device and verify screen ribbon cable connection',
  5,
  false
FROM diagnostic_problems p WHERE p.name = 'Screen Issues';

-- Insert diagnostic checklist items for "Battery Problems" problem
INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Check Battery Health',
  'Use diagnostic tools to check battery health percentage',
  1,
  true
FROM diagnostic_problems p WHERE p.name = 'Battery Problems';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Test Charging Speed',
  'Monitor charging speed and time to full charge',
  2,
  true
FROM diagnostic_problems p WHERE p.name = 'Battery Problems';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Check Battery Temperature',
  'Monitor battery temperature during charging and usage',
  3,
  true
FROM diagnostic_problems p WHERE p.name = 'Battery Problems';

INSERT INTO diagnostic_checklist_items (problem_id, title, description, order_index, is_required) 
SELECT 
  p.id,
  'Test Battery Drain',
  'Monitor battery drain rate during normal usage',
  4,
  true
FROM diagnostic_problems p WHERE p.name = 'Battery Problems';

-- Enable RLS
ALTER TABLE diagnostic_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_diagnostic_checklists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view diagnostic problems" ON diagnostic_problems FOR SELECT USING (true);
CREATE POLICY "Admins can manage diagnostic problems" ON diagnostic_problems FOR ALL USING (
  EXISTS (SELECT 1 FROM auth_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Users can view diagnostic checklist items" ON diagnostic_checklist_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage diagnostic checklist items" ON diagnostic_checklist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM auth_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Users can view device diagnostic checklists" ON device_diagnostic_checklists FOR SELECT USING (true);
CREATE POLICY "Users can manage device diagnostic checklists" ON device_diagnostic_checklists FOR ALL USING (
  EXISTS (SELECT 1 FROM auth_users WHERE id = auth.uid())
);
