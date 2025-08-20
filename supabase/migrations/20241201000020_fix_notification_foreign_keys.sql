-- Fix notification foreign key references
-- Change from auth.users(id) to auth_users(id)

-- Drop existing foreign key constraints
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_actioned_by_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_dismissed_by_fkey;

ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

ALTER TABLE notification_actions DROP CONSTRAINT IF EXISTS notification_actions_performed_by_fkey;

-- Add new foreign key constraints referencing auth_users
ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_actioned_by_fkey 
FOREIGN KEY (actioned_by) REFERENCES auth_users(id) ON DELETE SET NULL;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_dismissed_by_fkey 
FOREIGN KEY (dismissed_by) REFERENCES auth_users(id) ON DELETE SET NULL;

ALTER TABLE notification_settings 
ADD CONSTRAINT notification_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE;

ALTER TABLE notification_actions 
ADD CONSTRAINT notification_actions_performed_by_fkey 
FOREIGN KEY (performed_by) REFERENCES auth_users(id) ON DELETE CASCADE;
