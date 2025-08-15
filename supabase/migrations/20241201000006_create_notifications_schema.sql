-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    actioned_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    actioned_by UUID REFERENCES auth.users(id),
    dismissed_by UUID REFERENCES auth.users(id),
    
    -- Related data
    device_id UUID,
    customer_id UUID,
    appointment_id UUID,
    diagnostic_id UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    icon TEXT,
    color TEXT,
    action_url TEXT,
    action_text TEXT,
    
    -- Grouping
    group_id TEXT,
    is_grouped BOOLEAN DEFAULT FALSE,
    group_count INTEGER DEFAULT 1
);

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Delivery preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    whatsapp_notifications BOOLEAN DEFAULT TRUE,
    
    -- Category preferences
    device_notifications BOOLEAN DEFAULT TRUE,
    customer_notifications BOOLEAN DEFAULT TRUE,
    payment_notifications BOOLEAN DEFAULT TRUE,
    inventory_notifications BOOLEAN DEFAULT TRUE,
    system_notifications BOOLEAN DEFAULT TRUE,
    appointment_notifications BOOLEAN DEFAULT TRUE,
    diagnostic_notifications BOOLEAN DEFAULT TRUE,
    loyalty_notifications BOOLEAN DEFAULT TRUE,
    communication_notifications BOOLEAN DEFAULT TRUE,
    backup_notifications BOOLEAN DEFAULT TRUE,
    security_notifications BOOLEAN DEFAULT TRUE,
    goal_notifications BOOLEAN DEFAULT TRUE,
    
    -- Priority preferences
    low_priority_notifications BOOLEAN DEFAULT TRUE,
    normal_priority_notifications BOOLEAN DEFAULT TRUE,
    high_priority_notifications BOOLEAN DEFAULT TRUE,
    urgent_priority_notifications BOOLEAN DEFAULT TRUE,
    
    -- Time preferences
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'UTC',
    
    -- Frequency preferences
    digest_enabled BOOLEAN DEFAULT FALSE,
    digest_frequency TEXT DEFAULT 'daily',
    digest_time TIME DEFAULT '09:00',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification actions table
CREATE TABLE IF NOT EXISTS notification_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    icon TEXT,
    color TEXT,
    action_text TEXT,
    action_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_actions_notification_id ON notification_actions(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_actions_performed_by ON notification_actions(performed_by);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON notification_templates(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification settings
CREATE POLICY "Users can view their own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" ON notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification actions
CREATE POLICY "Users can view notification actions for their notifications" ON notification_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM notifications 
            WHERE notifications.id = notification_actions.notification_id 
            AND notifications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert notification actions for their notifications" ON notification_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM notifications 
            WHERE notifications.id = notification_actions.notification_id 
            AND notifications.user_id = auth.uid()
        )
    );

-- Create RLS policies for notification templates (admin only)
CREATE POLICY "Admins can manage notification templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default notification templates
INSERT INTO notification_templates (name, type, category, title, message, priority, icon, color) VALUES
('Device Status Change', 'device_status_change', 'devices', 'Device Status Updated', 'Device {device_name} status has been updated to {new_status}', 'normal', '📱', 'text-blue-600 bg-blue-50'),
('New Customer', 'new_customer', 'customers', 'New Customer Registered', 'A new customer {customer_name} has been registered', 'normal', '👤', 'text-green-600 bg-green-50'),
('Payment Received', 'payment_received', 'payments', 'Payment Received', 'Payment of {amount} has been received for {device_name}', 'normal', '💰', 'text-green-600 bg-green-50'),
('Inventory Low', 'inventory_low', 'inventory', 'Low Inventory Alert', 'Item {item_name} is running low on stock (Quantity: {quantity})', 'high', '📦', 'text-orange-600 bg-orange-50'),
('System Alert', 'system_alert', 'system', 'System Alert', '{alert_message}', 'high', '⚠️', 'text-red-600 bg-red-50'),
('Appointment Reminder', 'appointment_reminder', 'appointments', 'Appointment Reminder', 'You have an appointment scheduled for {appointment_time}', 'normal', '📅', 'text-blue-600 bg-blue-50'),
('Diagnostic Complete', 'diagnostic_complete', 'diagnostics', 'Diagnostic Complete', 'Diagnostic for {device_name} has been completed', 'normal', '🔍', 'text-green-600 bg-green-50'),
('Repair Complete', 'repair_complete', 'devices', 'Repair Complete', 'Repair for {device_name} has been completed successfully', 'normal', '✅', 'text-green-600 bg-green-50'),
('Customer Feedback', 'customer_feedback', 'customers', 'Customer Feedback', 'New feedback received from {customer_name}', 'normal', '💬', 'text-blue-600 bg-blue-50'),
('WhatsApp Message', 'whatsapp_message', 'communications', 'New WhatsApp Message', 'New message received from {customer_name}', 'normal', '📱', 'text-green-600 bg-green-50'),
('Backup Complete', 'backup_complete', 'backup', 'Backup Complete', 'Database backup has been completed successfully', 'normal', '💾', 'text-green-600 bg-green-50'),
('Security Alert', 'security_alert', 'security', 'Security Alert', '{security_message}', 'urgent', '🔒', 'text-red-600 bg-red-50'),
('Goal Achieved', 'goal_achieved', 'goals', 'Goal Achieved', 'Congratulations! You have achieved your goal: {goal_name}', 'normal', '🎯', 'text-purple-600 bg-purple-50'),
('Overdue Device', 'overdue_device', 'devices', 'Overdue Device', 'Device {device_name} is overdue for pickup', 'high', '⏰', 'text-orange-600 bg-orange-50'),
('New Remark', 'new_remark', 'devices', 'New Remark', 'New remark added to device {device_name}', 'normal', '💭', 'text-blue-600 bg-blue-50'),
('Loyalty Points', 'loyalty_points', 'loyalty', 'Loyalty Points Update', 'Customer {customer_name} has earned {points} loyalty points', 'normal', '⭐', 'text-yellow-600 bg-yellow-50'),
('Bulk SMS Sent', 'bulk_sms_sent', 'communications', 'Bulk SMS Sent', 'Bulk SMS has been sent to {count} customers', 'normal', '📨', 'text-blue-600 bg-blue-50'),
('Export Complete', 'export_complete', 'system', 'Export Complete', 'Data export has been completed successfully', 'normal', '📊', 'text-green-600 bg-green-50')
ON CONFLICT (name) DO NOTHING;
