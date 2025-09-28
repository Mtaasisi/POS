-- Fix lats_pos_general_settings table
-- Migration: 20250131000020_fix_pos_settings_table.sql

-- Create lats_pos_general_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS lats_pos_general_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lats_pos_general_settings_key ON lats_pos_general_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_lats_pos_general_settings_active ON lats_pos_general_settings(is_active);

-- Enable Row Level Security
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_general_settings;
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_general_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON lats_pos_general_settings TO authenticated;

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_lats_pos_general_settings_updated_at ON lats_pos_general_settings;
CREATE TRIGGER update_lats_pos_general_settings_updated_at 
    BEFORE UPDATE ON lats_pos_general_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings if they don't exist
INSERT INTO lats_pos_general_settings (setting_key, setting_value, setting_type, description) VALUES
    ('company_name', 'LATS Repair Shop', 'string', 'Company name for receipts and invoices'),
    ('company_address', 'Dar es Salaam, Tanzania', 'string', 'Company address'),
    ('company_phone', '+255 XXX XXX XXX', 'string', 'Company phone number'),
    ('currency', 'TZS', 'string', 'Default currency'),
    ('tax_rate', '0.18', 'number', 'Default tax rate (18%)'),
    ('receipt_footer', 'Thank you for your business!', 'string', 'Footer text for receipts'),
    ('auto_print_receipts', 'true', 'boolean', 'Automatically print receipts after sale'),
    ('enable_barcode_scanner', 'true', 'boolean', 'Enable barcode scanner functionality')
ON CONFLICT (setting_key) DO NOTHING;

-- Show success message
SELECT 'POS general settings table created successfully' as message;
