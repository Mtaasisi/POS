-- Create diagnostic_categories table for managing diagnostic template categories
-- This table stores custom categories for diagnostic problem templates

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create diagnostic_categories table
CREATE TABLE IF NOT EXISTS diagnostic_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    icon TEXT DEFAULT 'Settings',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_categories_name ON diagnostic_categories(name);
CREATE INDEX IF NOT EXISTS idx_diagnostic_categories_active ON diagnostic_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_diagnostic_categories_sort_order ON diagnostic_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_diagnostic_categories_created_by ON diagnostic_categories(created_by);

-- Enable Row Level Security
ALTER TABLE diagnostic_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all authenticated users" ON diagnostic_categories 
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON diagnostic_categories 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON diagnostic_categories 
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON diagnostic_categories 
    FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON diagnostic_categories TO authenticated;
GRANT ALL ON diagnostic_categories TO anon;

-- Add comments for documentation
COMMENT ON TABLE diagnostic_categories IS 'Stores custom categories for diagnostic problem templates';
COMMENT ON COLUMN diagnostic_categories.name IS 'Unique name of the diagnostic category';
COMMENT ON COLUMN diagnostic_categories.description IS 'Description of what this category covers';
COMMENT ON COLUMN diagnostic_categories.color IS 'Hex color code for category display';
COMMENT ON COLUMN diagnostic_categories.icon IS 'Icon name for category display';
COMMENT ON COLUMN diagnostic_categories.is_active IS 'Whether this category is active and available for use';
COMMENT ON COLUMN diagnostic_categories.sort_order IS 'Order for display (lower numbers first)';

-- Insert default categories
INSERT INTO diagnostic_categories (name, description, color, icon, sort_order, created_by) VALUES
('General', 'General diagnostic issues and common problems', '#3B82F6', 'Settings', 1, null),
('Power', 'Power-related issues including charging and battery problems', '#EF4444', 'Battery', 2, null),
('Display', 'Screen, display, and visual issues', '#10B981', 'Monitor', 3, null),
('Audio', 'Speaker, microphone, and audio-related problems', '#F59E0B', 'Speaker', 4, null),
('Camera', 'Camera and photography-related issues', '#8B5CF6', 'Camera', 5, null),
('Network', 'WiFi, cellular, and connectivity problems', '#06B6D4', 'Wifi', 6, null),
('Hardware', 'Physical hardware and component issues', '#6B7280', 'Cpu', 7, null),
('Software', 'Software, OS, and application-related problems', '#EC4899', 'FileText', 8, null)
ON CONFLICT (name) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_diagnostic_category_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_diagnostic_categories_updated_at ON diagnostic_categories;
CREATE TRIGGER update_diagnostic_categories_updated_at
    BEFORE UPDATE ON diagnostic_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_diagnostic_category_updated_at();
