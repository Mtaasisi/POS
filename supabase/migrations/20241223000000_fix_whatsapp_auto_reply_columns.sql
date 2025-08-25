-- Fix WhatsApp auto-reply rules column mismatch
-- Add missing columns that the frontend expects

-- Add trigger column (alias for trigger_text)
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS trigger TEXT;

-- Add response column (alias for response_text)  
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS response TEXT;

-- Add enabled column (alias for is_active)
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Add case_sensitive column
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN DEFAULT false;

-- Add exact_match column
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS exact_match BOOLEAN DEFAULT false;

-- Update existing records to populate the new columns
UPDATE whatsapp_auto_reply_rules 
SET 
    trigger = trigger_text,
    response = response_text,
    enabled = is_active,
    case_sensitive = CASE 
        WHEN trigger_type = 'exact_match' THEN true 
        ELSE false 
    END,
    exact_match = CASE 
        WHEN trigger_type = 'exact_match' THEN true 
        ELSE false 
    END
WHERE trigger IS NULL OR response IS NULL OR enabled IS NULL;

-- Create a view to ensure backward compatibility
CREATE OR REPLACE VIEW whatsapp_auto_reply_rules_compat AS
SELECT 
    id,
    name,
    description,
    trigger_text as trigger,
    response_text as response,
    is_active as enabled,
    trigger_type,
    case_sensitive,
    exact_match,
    priority,
    category,
    delay_seconds,
    max_uses_per_day,
    current_uses_today,
    last_used_at,
    conditions,
    variables,
    created_at,
    updated_at
FROM whatsapp_auto_reply_rules;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_enabled ON whatsapp_auto_reply_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_case_sensitive ON whatsapp_auto_reply_rules(case_sensitive);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_exact_match ON whatsapp_auto_reply_rules(exact_match);

-- Update RLS policies to include the new columns
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON whatsapp_auto_reply_rules;
CREATE POLICY "Enable read access for authenticated users" ON whatsapp_auto_reply_rules
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON whatsapp_auto_reply_rules;
CREATE POLICY "Enable insert access for authenticated users" ON whatsapp_auto_reply_rules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON whatsapp_auto_reply_rules;
CREATE POLICY "Enable update access for authenticated users" ON whatsapp_auto_reply_rules
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON whatsapp_auto_reply_rules;
CREATE POLICY "Enable delete access for authenticated users" ON whatsapp_auto_reply_rules
    FOR DELETE USING (auth.role() = 'authenticated');
