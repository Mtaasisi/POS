-- Migration: 20250131000041_create_admin_notifications_table.sql
-- Create admin_notifications table to fix 404 error in diagnostic checklist

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Related data
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    diagnostic_id UUID,
    appointment_id UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    icon TEXT,
    color TEXT,
    action_url TEXT,
    action_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- User tracking
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    read_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_device_id ON admin_notifications(device_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_customer_id ON admin_notifications(customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON admin_notifications;
DROP POLICY IF EXISTS "Enable insert access for all users" ON admin_notifications;
DROP POLICY IF EXISTS "Enable update access for all users" ON admin_notifications;
DROP POLICY IF EXISTS "Enable delete access for all users" ON admin_notifications;

-- Create policies for admin notifications
CREATE POLICY "Enable read access for all users" ON admin_notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON admin_notifications FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON admin_notifications FOR DELETE USING (true);

-- Create trigger for updated_at (if needed in the future)
CREATE OR REPLACE FUNCTION update_admin_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_notifications' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE admin_notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_admin_notifications_updated_at ON admin_notifications;
CREATE TRIGGER trigger_update_admin_notifications_updated_at
    BEFORE UPDATE ON admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_notifications_updated_at();

-- Insert some sample notification templates (optional)
INSERT INTO admin_notifications (device_id, type, title, message, status, priority, created_at)
SELECT 
    NULL as device_id,
    'diagnostic_report' as type,
    'Sample Diagnostic Report' as title,
    'This is a sample diagnostic report notification' as message,
    'unread' as status,
    'normal' as priority,
    NOW() as created_at
WHERE NOT EXISTS (SELECT 1 FROM admin_notifications WHERE type = 'diagnostic_report' LIMIT 1);

-- Add comments for documentation
COMMENT ON TABLE admin_notifications IS 'Table for storing admin-specific notifications, particularly diagnostic reports and system alerts';
COMMENT ON COLUMN admin_notifications.device_id IS 'Reference to the device this notification is about';
COMMENT ON COLUMN admin_notifications.type IS 'Type of notification (e.g., diagnostic_report, system_alert, etc.)';
COMMENT ON COLUMN admin_notifications.status IS 'Current status of the notification (unread, read, archived)';
COMMENT ON COLUMN admin_notifications.priority IS 'Priority level of the notification (low, normal, high, urgent)';
