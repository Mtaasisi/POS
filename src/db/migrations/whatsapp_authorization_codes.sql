-- WhatsApp Authorization Codes Table
-- This table stores authorization codes for Green API phone number linking

CREATE TABLE IF NOT EXISTS whatsapp_authorization_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_id VARCHAR(50) NOT NULL REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
    
    -- Authorization code details
    authorization_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    
    -- Status and timing
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(instance_id, authorization_code)
);

-- Enable Row Level Security
ALTER TABLE whatsapp_authorization_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own authorization codes" 
ON whatsapp_authorization_codes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own authorization codes" 
ON whatsapp_authorization_codes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own authorization codes" 
ON whatsapp_authorization_codes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own authorization codes" 
ON whatsapp_authorization_codes FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_codes_user_id ON whatsapp_authorization_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_codes_instance_id ON whatsapp_authorization_codes(instance_id);
CREATE INDEX IF NOT EXISTS idx_auth_codes_phone ON whatsapp_authorization_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON whatsapp_authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_codes_used ON whatsapp_authorization_codes(is_used);

-- Create trigger for updated_at
CREATE TRIGGER update_whatsapp_auth_codes_updated_at 
BEFORE UPDATE ON whatsapp_authorization_codes 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
