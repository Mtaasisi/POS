-- Fix Missing Device Tables
-- This script creates the missing device_checklists and device_attachments tables

-- Create device_checklists table
CREATE TABLE IF NOT EXISTS device_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL DEFAULT 'repair' CHECK (checklist_type IN ('repair', 'diagnostic', 'quality_check', 'handover')),
  items JSONB NOT NULL DEFAULT '[]',
  completed_items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_attachments table
CREATE TABLE IF NOT EXISTS device_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for device_checklists
CREATE INDEX IF NOT EXISTS idx_device_checklists_device_id ON device_checklists(device_id);
CREATE INDEX IF NOT EXISTS idx_device_checklists_status ON device_checklists(status);
CREATE INDEX IF NOT EXISTS idx_device_checklists_type ON device_checklists(checklist_type);
CREATE INDEX IF NOT EXISTS idx_device_checklists_assigned_to ON device_checklists(assigned_to);

-- Create indexes for device_attachments
CREATE INDEX IF NOT EXISTS idx_device_attachments_device_id ON device_attachments(device_id);
CREATE INDEX IF NOT EXISTS idx_device_attachments_uploaded_at ON device_attachments(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_device_attachments_file_type ON device_attachments(file_type);

-- Create trigger function for updated_at column (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_device_checklists_updated_at ON device_checklists;
CREATE TRIGGER update_device_checklists_updated_at 
    BEFORE UPDATE ON device_checklists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_device_attachments_updated_at ON device_attachments;
CREATE TRIGGER update_device_attachments_updated_at 
    BEFORE UPDATE ON device_attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE device_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for device_checklists
DROP POLICY IF EXISTS "Users can view device checklists" ON device_checklists;
CREATE POLICY "Users can view device checklists" ON device_checklists
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert device checklists" ON device_checklists;
CREATE POLICY "Users can insert device checklists" ON device_checklists
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update device checklists" ON device_checklists;
CREATE POLICY "Users can update device checklists" ON device_checklists
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete device checklists" ON device_checklists;
CREATE POLICY "Users can delete device checklists" ON device_checklists
    FOR DELETE USING (true);

-- Create RLS policies for device_attachments
DROP POLICY IF EXISTS "Users can view device attachments" ON device_attachments;
CREATE POLICY "Users can view device attachments" ON device_attachments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert device attachments" ON device_attachments;
CREATE POLICY "Users can insert device attachments" ON device_attachments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update device attachments" ON device_attachments;
CREATE POLICY "Users can update device attachments" ON device_attachments
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete device attachments" ON device_attachments;
CREATE POLICY "Users can delete device attachments" ON device_attachments
    FOR DELETE USING (true);

-- Verify tables were created
SELECT 
    table_name,
    '✅ CREATED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('device_checklists', 'device_attachments')
ORDER BY table_name; 