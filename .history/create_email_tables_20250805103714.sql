-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    category TEXT CHECK (category IN ('promotional', 'service', 'reminder', 'birthday', 'loyalty')) DEFAULT 'service',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    template_id TEXT REFERENCES email_templates(id) ON DELETE CASCADE,
    template_name TEXT,
    target_audience TEXT CHECK (target_audience IN ('all', 'vip', 'inactive', 'active', 'custom')) DEFAULT 'all',
    status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')) DEFAULT 'draft',
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES email_campaigns(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('sent', 'failed', 'bounced')) DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

-- Add RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policies for email_templates
CREATE POLICY "Users can view email templates" ON email_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert email templates" ON email_templates
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update email templates" ON email_templates
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete email templates" ON email_templates
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Policies for email_campaigns
CREATE POLICY "Users can view email campaigns" ON email_campaigns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert email campaigns" ON email_campaigns
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update email campaigns" ON email_campaigns
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete email campaigns" ON email_campaigns
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Policies for email_logs
CREATE POLICY "Users can view email logs" ON email_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert email logs" ON email_logs
    FOR INSERT WITH CHECK (true);

-- Insert some default email templates
INSERT INTO email_templates (id, name, subject, content, variables, category, is_active) VALUES
(
    'template-welcome',
    'Welcome Email',
    'Welcome to our service!',
    'Dear {{customer_name}},\n\nWelcome to our service! We are excited to have you on board.\n\nBest regards,\nYour Service Team',
    ARRAY['customer_name', 'customer_email'],
    'service',
    true
),
(
    'template-reminder',
    'Service Reminder',
    'Your device is ready for pickup',
    'Dear {{customer_name}},\n\nYour device is ready for pickup. Please visit us to collect it.\n\nBest regards,\nYour Service Team',
    ARRAY['customer_name', 'device_name', 'pickup_date'],
    'reminder',
    true
),
(
    'template-birthday',
    'Birthday Greeting',
    'Happy Birthday!',
    'Dear {{customer_name}},\n\nHappy Birthday! We hope you have a wonderful day.\n\nBest regards,\nYour Service Team',
    ARRAY['customer_name'],
    'birthday',
    true
)
ON CONFLICT (id) DO NOTHING; 