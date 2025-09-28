-- Create WhatsApp Messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id TEXT NOT NULL REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll')),
    content TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_chat ON whatsapp_messages(instance_id, chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);

-- Create WhatsApp Hub Settings table
CREATE TABLE IF NOT EXISTS whatsapp_hub_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_refresh_interval INTEGER NOT NULL DEFAULT 30,
    default_message_type TEXT NOT NULL DEFAULT 'text',
    enable_notifications BOOLEAN NOT NULL DEFAULT true,
    enable_sound_alerts BOOLEAN NOT NULL DEFAULT true,
    max_retries INTEGER NOT NULL DEFAULT 3,
    message_delay INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to both tables
CREATE TRIGGER update_whatsapp_messages_updated_at 
    BEFORE UPDATE ON whatsapp_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_hub_settings_updated_at 
    BEFORE UPDATE ON whatsapp_hub_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_hub_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for whatsapp_messages
CREATE POLICY "Users can view messages for their instances" ON whatsapp_messages
    FOR SELECT USING (
        instance_id IN (
            SELECT instance_id 
            FROM whatsapp_instances_comprehensive 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages for their instances" ON whatsapp_messages
    FOR INSERT WITH CHECK (
        instance_id IN (
            SELECT instance_id 
            FROM whatsapp_instances_comprehensive 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages for their instances" ON whatsapp_messages
    FOR UPDATE USING (
        instance_id IN (
            SELECT instance_id 
            FROM whatsapp_instances_comprehensive 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages for their instances" ON whatsapp_messages
    FOR DELETE USING (
        instance_id IN (
            SELECT instance_id 
            FROM whatsapp_instances_comprehensive 
            WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for whatsapp_hub_settings
CREATE POLICY "Users can view their own settings" ON whatsapp_hub_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON whatsapp_hub_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON whatsapp_hub_settings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own settings" ON whatsapp_hub_settings
    FOR DELETE USING (user_id = auth.uid());

-- Insert default settings for existing users
INSERT INTO whatsapp_hub_settings (user_id, auto_refresh_interval, default_message_type, enable_notifications, enable_sound_alerts, max_retries, message_delay)
SELECT 
    id as user_id,
    30 as auto_refresh_interval,
    'text' as default_message_type,
    true as enable_notifications,
    true as enable_sound_alerts,
    3 as max_retries,
    1000 as message_delay
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM whatsapp_hub_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Create a view for conversation summaries
CREATE OR REPLACE VIEW whatsapp_conversations AS
SELECT DISTINCT ON (instance_id, chat_id)
    instance_id,
    chat_id,
    sender_name as customer_name,
    CASE 
        WHEN chat_id LIKE '%@c.us' THEN REPLACE(REPLACE(chat_id, '@c.us', ''), '+', '')
        ELSE chat_id
    END as customer_phone,
    content as last_message,
    timestamp as last_message_time,
    direction,
    status,
    (
        SELECT COUNT(*) 
        FROM whatsapp_messages m2 
        WHERE m2.instance_id = whatsapp_messages.instance_id 
        AND m2.chat_id = whatsapp_messages.chat_id 
        AND m2.direction = 'incoming' 
        AND m2.status != 'read'
    ) as unread_count
FROM whatsapp_messages
ORDER BY instance_id, chat_id, timestamp DESC;
