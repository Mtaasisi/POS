-- Fix missing columns in whatsapp_auto_reply_rules table
-- Add name and description columns that are expected by the frontend

-- Add missing name column
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add missing description column
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records with default values
UPDATE whatsapp_auto_reply_rules 
SET 
    name = COALESCE(name, 'Auto Reply Rule ' || id::text),
    description = COALESCE(description, 'Automated response rule')
WHERE name IS NULL OR description IS NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_name ON whatsapp_auto_reply_rules(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_description ON whatsapp_auto_reply_rules(description);

-- Update existing rules with meaningful names based on their content
UPDATE whatsapp_auto_reply_rules 
SET 
    name = CASE 
        WHEN trigger_text ILIKE '%hello%' THEN 'Welcome Message'
        WHEN trigger_text ILIKE '%help%' THEN 'Help Request'
        WHEN trigger_text ILIKE '%thank%' THEN 'Thank You Response'
        WHEN trigger_text ILIKE '%hours%' THEN 'Business Hours'
        WHEN trigger_text ILIKE '%contact%' THEN 'Contact Information'
        ELSE 'Auto Reply Rule ' || id::text
    END,
    description = CASE 
        WHEN trigger_text ILIKE '%hello%' THEN 'Auto-reply to welcome messages'
        WHEN trigger_text ILIKE '%help%' THEN 'Auto-reply to help requests'
        WHEN trigger_text ILIKE '%thank%' THEN 'Auto-reply to thank you messages'
        WHEN trigger_text ILIKE '%hours%' THEN 'Auto-reply about business hours'
        WHEN trigger_text ILIKE '%contact%' THEN 'Auto-reply with contact information'
        ELSE 'Automated response rule'
    END
WHERE name = 'Auto Reply Rule ' || id::text;

-- Ensure all columns have proper defaults
ALTER TABLE whatsapp_auto_reply_rules 
ALTER COLUMN name SET DEFAULT 'Auto Reply Rule',
ALTER COLUMN description SET DEFAULT 'Automated response rule',
ALTER COLUMN enabled SET DEFAULT true,
ALTER COLUMN case_sensitive SET DEFAULT false,
ALTER COLUMN exact_match SET DEFAULT false,
ALTER COLUMN priority SET DEFAULT 0,
ALTER COLUMN category SET DEFAULT 'general',
ALTER COLUMN delay_seconds SET DEFAULT 0,
ALTER COLUMN max_uses_per_day SET DEFAULT 0,
ALTER COLUMN current_uses_today SET DEFAULT 0,
ALTER COLUMN conditions SET DEFAULT '{}',
ALTER COLUMN variables SET DEFAULT '{}';

-- Create a comprehensive view for backward compatibility
CREATE OR REPLACE VIEW whatsapp_auto_reply_rules_compat AS
SELECT 
    id,
    COALESCE(name, 'Auto Reply Rule ' || id::text) as name,
    COALESCE(description, 'Automated response rule') as description,
    trigger_text as trigger,
    response_text as response,
    is_active as enabled,
    trigger_type,
    case_sensitive,
    exact_match,
    priority,
    COALESCE(category, 'general') as category,
    delay_seconds,
    max_uses_per_day,
    current_uses_today,
    last_used_at,
    conditions,
    variables,
    created_at,
    updated_at
FROM whatsapp_auto_reply_rules;
