-- Create Admin Settings Tables
-- This script creates the necessary tables to store admin settings

-- Create admin_settings table for storing system-wide settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'database', 'backend', 'integrations', 'security', 'performance', 'monitoring', 'automation', 'branding'
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'array'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, setting_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow admin users to manage settings" ON admin_settings
  FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_settings_updated_at 
  BEFORE UPDATE ON admin_settings 
  FOR EACH ROW EXECUTE FUNCTION update_admin_settings_updated_at();

-- Insert default admin settings
INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, description) VALUES
-- Database Settings
('database', 'url', '"https://jxhzveborezjhsmzsgbc.supabase.co"', 'string', 'Database connection URL'),
('database', 'project_id', '"jxhzveborezjhsmzsgbc"', 'string', 'Supabase project ID'),
('database', 'region', '"us-east-1"', 'string', 'Database region'),
('database', 'max_connections', '100', 'number', 'Maximum database connections'),
('database', 'connection_pool', '10', 'number', 'Connection pool size'),

-- Backend Settings
('backend', 'api_url', '"https://api.repairshop.com"', 'string', 'Backend API URL'),
('backend', 'environment', '"production"', 'string', 'Environment (development/staging/production)'),
('backend', 'version', '"1.0.0"', 'string', 'Application version'),
('backend', 'session_timeout', '3600', 'number', 'Session timeout in seconds'),

-- Integrations Settings
('integrations', 'sms_provider', '"Mobishastra"', 'string', 'SMS service provider'),
('integrations', 'sms_balance', '1000', 'number', 'SMS balance'),
('integrations', 'email_provider', '"Supabase Auth"', 'string', 'Email service provider'),
('integrations', 'email_daily_limit', '1000', 'number', 'Daily email limit'),
('integrations', 'whatsapp_provider', '"Green API"', 'string', 'WhatsApp service provider'),
('integrations', 'whatsapp_connected', 'false', 'boolean', 'WhatsApp connection status'),
('integrations', 'ai_provider', '"Google Gemini"', 'string', 'AI service provider'),
('integrations', 'ai_model', '"gemini-pro"', 'string', 'AI model name'),
('integrations', 'ai_api_key_configured', 'true', 'boolean', 'AI API key status'),

-- Security Settings
('security', 'ssl_enabled', 'true', 'boolean', 'SSL/TLS encryption enabled'),
('security', 'encryption_level', '"AES-256"', 'string', 'Encryption level'),
('security', 'max_login_attempts', '5', 'number', 'Maximum login attempts'),
('security', 'password_policy', '"Strong"', 'string', 'Password policy strength'),
('security', 'two_factor_enabled', 'false', 'boolean', 'Two-factor authentication enabled'),

-- Performance Settings
('performance', 'cache_enabled', 'true', 'boolean', 'Caching enabled'),
('performance', 'cache_size', '512', 'number', 'Cache size in MB'),
('performance', 'compression_enabled', 'true', 'boolean', 'Compression enabled'),
('performance', 'cdn_enabled', 'false', 'boolean', 'CDN enabled'),
('performance', 'load_balancing', 'false', 'boolean', 'Load balancing enabled'),

-- Monitoring Settings
('monitoring', 'health_checks', 'true', 'boolean', 'Health checks enabled'),
('monitoring', 'error_tracking', 'true', 'boolean', 'Error tracking enabled'),
('monitoring', 'performance_monitoring', 'true', 'boolean', 'Performance monitoring enabled'),
('monitoring', 'backup_monitoring', 'true', 'boolean', 'Backup monitoring enabled'),
('monitoring', 'alert_notifications', 'true', 'boolean', 'Alert notifications enabled'),

-- Automation Settings
('automation', 'auto_backup', 'true', 'boolean', 'Automatic backup enabled'),
('automation', 'auto_cleanup', 'true', 'boolean', 'Automatic cleanup enabled'),
('automation', 'auto_scaling', 'false', 'boolean', 'Auto scaling enabled'),
('automation', 'auto_updates', 'false', 'boolean', 'Automatic updates enabled'),

-- Branding Settings
('branding', 'app_logo', '""', 'string', 'Application logo URL'),
('branding', 'company_name', '"Repair Shop Management"', 'string', 'Company name'),
('branding', 'primary_color', '"#3B82F6"', 'string', 'Primary brand color'),
('branding', 'secondary_color', '"#1E40AF"', 'string', 'Secondary brand color'),
('branding', 'logo_size', '"medium"', 'string', 'Logo size (small/medium/large)'),
('branding', 'logo_position', '"left"', 'string', 'Logo position (left/center/right)')

ON CONFLICT (category, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Create admin_settings_log table for tracking changes
CREATE TABLE IF NOT EXISTS admin_settings_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_id UUID REFERENCES admin_settings(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for settings log
CREATE INDEX IF NOT EXISTS idx_admin_settings_log_category ON admin_settings_log(category);
CREATE INDEX IF NOT EXISTS idx_admin_settings_log_created_at ON admin_settings_log(created_at);

-- Enable RLS for settings log
ALTER TABLE admin_settings_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for settings log
CREATE POLICY "Allow admin users to view settings log" ON admin_settings_log
  FOR SELECT USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin users to insert settings log" ON admin_settings_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- Create function to log setting changes
CREATE OR REPLACE FUNCTION log_setting_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO admin_settings_log (setting_id, category, setting_key, old_value, new_value, changed_by)
    VALUES (OLD.id, OLD.category, OLD.setting_key, OLD.setting_value, NEW.setting_value, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO admin_settings_log (setting_id, category, setting_key, new_value, changed_by)
    VALUES (NEW.id, NEW.category, NEW.setting_key, NEW.setting_value, auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for logging setting changes
CREATE TRIGGER admin_settings_change_log
  AFTER INSERT OR UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION log_setting_change();

-- Create function to get settings by category
CREATE OR REPLACE FUNCTION get_admin_settings_by_category(category_name TEXT)
RETURNS TABLE (
  setting_key TEXT,
  setting_value JSONB,
  setting_type TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ads.setting_key,
    ads.setting_value,
    ads.setting_type,
    ads.description
  FROM admin_settings ads
  WHERE ads.category = category_name
    AND ads.is_active = true
  ORDER BY ads.setting_key;
END;
$$ LANGUAGE plpgsql;

-- Create function to update setting
CREATE OR REPLACE FUNCTION update_admin_setting(
  category_name TEXT,
  key_name TEXT,
  new_value JSONB,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  setting_id UUID;
BEGIN
  -- Check if user is admin
  IF auth.jwt() ->> 'role' != 'admin' THEN
    RAISE EXCEPTION 'Only admin users can update settings';
  END IF;

  -- Update the setting
  UPDATE admin_settings 
  SET setting_value = new_value, updated_at = NOW()
  WHERE category = category_name AND setting_key = key_name
  RETURNING id INTO setting_id;

  -- Log the change if reason is provided
  IF reason IS NOT NULL AND setting_id IS NOT NULL THEN
    UPDATE admin_settings_log 
    SET change_reason = reason
    WHERE setting_id = setting_id 
    AND created_at = (SELECT MAX(created_at) FROM admin_settings_log WHERE setting_id = setting_id);
  END IF;

  RETURN setting_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON admin_settings TO authenticated;
GRANT SELECT ON admin_settings_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_settings_by_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_admin_setting(TEXT, TEXT, JSONB, TEXT) TO authenticated;

-- Create view for easy settings access
CREATE OR REPLACE VIEW admin_settings_view AS
SELECT 
  category,
  setting_key,
  setting_value,
  setting_type,
  description,
  is_active,
  updated_at
FROM admin_settings
WHERE is_active = true
ORDER BY category, setting_key;

-- Grant access to the view
GRANT SELECT ON admin_settings_view TO authenticated; 