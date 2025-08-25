-- Fix WhatsApp auto-reply rules columns - CORRECTED VERSION
-- This migration properly handles column creation order

-- Step 1: Add missing columns first
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Add compatibility columns
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS trigger TEXT,
ADD COLUMN IF NOT EXISTS response TEXT,
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exact_match BOOLEAN DEFAULT false;

-- Step 3: Update existing records with default values for new columns
UPDATE whatsapp_auto_reply_rules 
SET 
    name = COALESCE(name, 'Auto Reply Rule ' || id::text),
    description = COALESCE(description, 'Automated response rule'),
    trigger = COALESCE(trigger, trigger_text),
    response = COALESCE(response, response_text),
    enabled = COALESCE(enabled, is_active),
    case_sensitive = COALESCE(case_sensitive, CASE WHEN trigger_type = 'exact_match' THEN true ELSE false END),
    exact_match = COALESCE(exact_match, CASE WHEN trigger_type = 'exact_match' THEN true ELSE false END)
WHERE name IS NULL OR description IS NULL OR trigger IS NULL OR response IS NULL;

-- Step 4: Update existing rules with meaningful names based on content
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

-- Step 5: Set proper defaults for all columns
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

-- Step 6: Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_name ON whatsapp_auto_reply_rules(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_description ON whatsapp_auto_reply_rules(description);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_enabled ON whatsapp_auto_reply_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_case_sensitive ON whatsapp_auto_reply_rules(case_sensitive);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_exact_match ON whatsapp_auto_reply_rules(exact_match);

-- Step 7: Create a comprehensive compatibility view
CREATE OR REPLACE VIEW whatsapp_auto_reply_rules_compat AS
SELECT 
    id,
    COALESCE(name, 'Auto Reply Rule ' || id::text) as name,
    COALESCE(description, 'Automated response rule') as description,
    COALESCE(trigger, trigger_text) as trigger,
    COALESCE(response, response_text) as response,
    COALESCE(enabled, is_active) as enabled,
    trigger_type,
    COALESCE(case_sensitive, CASE WHEN trigger_type = 'exact_match' THEN true ELSE false END) as case_sensitive,
    COALESCE(exact_match, CASE WHEN trigger_type = 'exact_match' THEN true ELSE false END) as exact_match,
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

-- Step 8: Update RLS policies to include the new columns
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
