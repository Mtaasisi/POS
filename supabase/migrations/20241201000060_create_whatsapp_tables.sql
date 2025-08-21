-- Create WhatsApp instances table
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id TEXT UNIQUE NOT NULL,
    api_token TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WhatsApp messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES whatsapp_instances(instance_id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll')),
    content TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WhatsApp webhooks table
CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_phone ON whatsapp_instances(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance ON whatsapp_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_type ON whatsapp_webhooks(type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_processed ON whatsapp_webhooks(processed);

-- Create RLS policies
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_instances
CREATE POLICY "Users can view their own WhatsApp instances" ON whatsapp_instances
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own WhatsApp instances" ON whatsapp_instances
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own WhatsApp instances" ON whatsapp_instances
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own WhatsApp instances" ON whatsapp_instances
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS policies for whatsapp_messages
CREATE POLICY "Users can view messages from their instances" ON whatsapp_messages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert messages to their instances" ON whatsapp_messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update messages from their instances" ON whatsapp_messages
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS policies for whatsapp_webhooks
CREATE POLICY "Users can view webhooks from their instances" ON whatsapp_webhooks
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert webhooks" ON whatsapp_webhooks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update webhooks" ON whatsapp_webhooks
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at 
    BEFORE UPDATE ON whatsapp_instances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at 
    BEFORE UPDATE ON whatsapp_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
