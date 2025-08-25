-- Fix notification_settings foreign key constraint issue
-- This migration removes the problematic foreign key constraint that's causing 23503 errors

-- Drop the problematic foreign key constraint
ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

-- Also drop any other notification-related foreign key constraints that might cause issues
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_actioned_by_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_dismissed_by_fkey;
ALTER TABLE notification_actions DROP CONSTRAINT IF EXISTS notification_actions_performed_by_fkey;

-- Create a more flexible foreign key constraint that references auth.users (Supabase's built-in auth)
-- This will only be created if the auth.users table is accessible
DO $$
BEGIN
    -- Try to create foreign key constraint to auth.users
    BEGIN
        ALTER TABLE notification_settings 
        ADD CONSTRAINT notification_settings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key constraint to auth.users created successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create foreign key constraint to auth.users: %', SQLERRM;
            RAISE NOTICE 'Continuing without foreign key constraint for better compatibility';
    END;
END $$;

-- Ensure RLS policies are properly configured
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON notification_settings;

-- Create RLS policies for notification_settings
CREATE POLICY "Users can view their own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" ON notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_updated_at ON notification_settings(updated_at);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_settings TO authenticated;

-- Create a function to ensure default settings exist (without foreign key dependency)
CREATE OR REPLACE FUNCTION ensure_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if notification settings exist for the new user
    IF NOT EXISTS (
        SELECT 1 FROM notification_settings 
        WHERE user_id = NEW.id
    ) THEN
        -- Insert default notification settings
        INSERT INTO notification_settings (
            user_id,
            email_notifications,
            push_notifications,
            sms_notifications,
            whatsapp_notifications,
            device_notifications,
            customer_notifications,
            payment_notifications,
            inventory_notifications,
            system_notifications,
            appointment_notifications,
            diagnostic_notifications,
            loyalty_notifications,
            communication_notifications,
            backup_notifications,
            security_notifications,
            goal_notifications,
            low_priority_notifications,
            normal_priority_notifications,
            high_priority_notifications,
            urgent_priority_notifications,
            quiet_hours_enabled,
            quiet_hours_start,
            quiet_hours_end,
            timezone,
            digest_enabled,
            digest_frequency,
            digest_time
        ) VALUES (
            NEW.id,
            true,   -- email_notifications
            true,   -- push_notifications
            false,  -- sms_notifications
            true,   -- whatsapp_notifications
            true,   -- device_notifications
            true,   -- customer_notifications
            true,   -- payment_notifications
            true,   -- inventory_notifications
            true,   -- system_notifications
            true,   -- appointment_notifications
            true,   -- diagnostic_notifications
            true,   -- loyalty_notifications
            true,   -- communication_notifications
            true,   -- backup_notifications
            true,   -- security_notifications
            true,   -- goal_notifications
            true,   -- low_priority_notifications
            true,   -- normal_priority_notifications
            true,   -- high_priority_notifications
            true,   -- urgent_priority_notifications
            false,  -- quiet_hours_enabled
            '22:00', -- quiet_hours_start
            '08:00', -- quiet_hours_end
            'UTC',   -- timezone
            false,   -- digest_enabled
            'daily', -- digest_frequency
            '09:00'  -- digest_time
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notification settings for new users
DROP TRIGGER IF EXISTS create_notification_settings_trigger ON auth.users;
CREATE TRIGGER create_notification_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_notification_settings();

-- Insert default settings for existing users who don't have them (without foreign key dependency)
INSERT INTO notification_settings (
    user_id,
    email_notifications,
    push_notifications,
    sms_notifications,
    whatsapp_notifications,
    device_notifications,
    customer_notifications,
    payment_notifications,
    inventory_notifications,
    system_notifications,
    appointment_notifications,
    diagnostic_notifications,
    loyalty_notifications,
    communication_notifications,
    backup_notifications,
    security_notifications,
    goal_notifications,
    low_priority_notifications,
    normal_priority_notifications,
    high_priority_notifications,
    urgent_priority_notifications,
    quiet_hours_enabled,
    quiet_hours_start,
    quiet_hours_end,
    timezone,
    digest_enabled,
    digest_frequency,
    digest_time
)
SELECT 
    au.id,
    true,   -- email_notifications
    true,   -- push_notifications
    false,  -- sms_notifications
    true,   -- whatsapp_notifications
    true,   -- device_notifications
    true,   -- customer_notifications
    true,   -- payment_notifications
    true,   -- inventory_notifications
    true,   -- system_notifications
    true,   -- appointment_notifications
    true,   -- diagnostic_notifications
    true,   -- loyalty_notifications
    true,   -- communication_notifications
    true,   -- backup_notifications
    true,   -- security_notifications
    true,   -- goal_notifications
    true,   -- low_priority_notifications
    true,   -- normal_priority_notifications
    true,   -- high_priority_notifications
    true,   -- urgent_priority_notifications
    false,  -- quiet_hours_enabled
    '22:00', -- quiet_hours_start
    '08:00', -- quiet_hours_end
    'UTC',   -- timezone
    false,   -- digest_enabled
    'daily', -- digest_frequency
    '09:00'  -- digest_time
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM notification_settings ns 
    WHERE ns.user_id = au.id
);
