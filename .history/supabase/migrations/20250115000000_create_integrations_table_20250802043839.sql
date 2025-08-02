-- Create integrations table for storing all integration configurations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('sms', 'email', 'ai', 'analytics', 'payment', 'storage', 'whatsapp')),
    provider VARCHAR(100) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integrations_updated_at();

-- Create function to get table statistics
CREATE OR REPLACE FUNCTION get_table_statistics()
RETURNS TABLE (
    name VARCHAR,
    row_count BIGINT,
    size TEXT,
    last_updated TIMESTAMP,
    schema TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::VARCHAR,
        COALESCE(c.reltuples::BIGINT, 0) as row_count,
        pg_size_pretty(pg_total_relation_size(c.oid))::TEXT as size,
        COALESCE(MAX(a.updated_at), NOW()) as last_updated,
        t.table_schema::TEXT
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN (
        SELECT 
            table_name,
            MAX(updated_at) as updated_at
        FROM (
            SELECT 'customers' as table_name, MAX(updated_at) as updated_at FROM customers
            UNION ALL
            SELECT 'devices' as table_name, MAX(updated_at) as updated_at FROM devices
            UNION ALL
            SELECT 'payments' as table_name, MAX(updated_at) as updated_at FROM payments
            UNION ALL
            SELECT 'audit_logs' as table_name, MAX(created_at) as updated_at FROM audit_logs
            UNION ALL
            SELECT 'settings' as table_name, MAX(updated_at) as updated_at FROM settings
        ) sub
        GROUP BY table_name
    ) a ON a.table_name = t.table_name
    WHERE t.table_schema = 'public'
    AND t.table_name IN ('customers', 'devices', 'payments', 'audit_logs', 'settings', 'integrations')
    GROUP BY t.table_name, t.table_schema, c.reltuples, c.oid;
END;
$$ LANGUAGE plpgsql;

-- Create function for database optimization
CREATE OR REPLACE FUNCTION optimize_database()
RETURNS VOID AS $$
BEGIN
    -- Analyze tables for better query planning
    ANALYZE customers;
    ANALYZE devices;
    ANALYZE payments;
    ANALYZE audit_logs;
    ANALYZE settings;
    ANALYZE integrations;
    
    -- Vacuum tables to reclaim storage
    VACUUM ANALYZE customers;
    VACUUM ANALYZE devices;
    VACUUM ANALYZE payments;
    VACUUM ANALYZE audit_logs;
    VACUUM ANALYZE settings;
    VACUUM ANALYZE integrations;
END;
$$ LANGUAGE plpgsql;

-- Insert some default integrations
INSERT INTO integrations (name, type, provider, config, is_active) VALUES
('WhatsApp Green API', 'whatsapp', 'green-api', '{"instanceId": "", "apiKey": ""}', false),
('SMS Provider', 'sms', 'africastalking', '{"apiKey": "", "senderId": ""}', false),
('Email Service', 'email', 'sendgrid', '{"apiKey": "", "fromEmail": ""}', false),
('Gemini AI', 'ai', 'gemini', '{"apiKey": "", "model": "gemini-pro"}', false),
('Payment Gateway', 'payment', 'mpesa', '{"publicKey": "", "secretKey": ""}', false),
('File Storage', 'storage', 'supabase-storage', '{"bucketName": "", "accessKey": ""}', false),
('Analytics', 'analytics', 'google-analytics', '{"trackingId": ""}', false)
ON CONFLICT (name) DO NOTHING; 