-- Create automation_rules table for payment automation
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('payment_processing', 'fraud_detection', 'reconciliation', 'notification', 'compliance')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    priority INTEGER NOT NULL DEFAULT 0,
    execution_count INTEGER NOT NULL DEFAULT 0,
    last_executed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_rules_status ON automation_rules(status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON automation_rules(type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_priority ON automation_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_automation_rules_created_at ON automation_rules(created_at);

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view automation rules" ON automation_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert automation rules" ON automation_rules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update automation rules" ON automation_rules
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete automation rules" ON automation_rules
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_automation_rules_updated_at
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_rules_updated_at();

-- Insert some default automation rules
INSERT INTO automation_rules (name, description, type, status, conditions, actions, priority, created_by) VALUES
(
    'Auto-approve small payments',
    'Automatically approve payments under 100,000 TZS',
    'payment_processing',
    'active',
    '[{"field": "amount", "operator": "less_than", "value": 100000}]'::jsonb,
    '[{"type": "update_status", "parameters": {"status": "approved"}}]'::jsonb,
    1,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Flag large payments',
    'Flag payments over 1,000,000 TZS for manual review',
    'fraud_detection',
    'active',
    '[{"field": "amount", "operator": "greater_than", "value": 1000000}]'::jsonb,
    '[{"type": "create_alert", "parameters": {"alert_type": "large_payment", "message": "Large payment requires review"}}]'::jsonb,
    2,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Daily reconciliation reminder',
    'Send daily reminder for payment reconciliation',
    'notification',
    'active',
    '[{"field": "time", "operator": "equals", "value": "daily"}]'::jsonb,
    '[{"type": "send_notification", "parameters": {"type": "email", "template": "daily_reconciliation"}}]'::jsonb,
    3,
    (SELECT id FROM auth.users LIMIT 1)
);

-- Grant necessary permissions
GRANT ALL ON automation_rules TO authenticated;
GRANT ALL ON automation_rules TO service_role;
