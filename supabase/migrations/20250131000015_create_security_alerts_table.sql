-- Create security_alerts table for payment security monitoring
-- Migration: 20250131000015_create_security_alerts_table.sql

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('suspicious_activity', 'failed_authentication', 'unusual_amount', 'multiple_failures', 'data_breach', 'compliance_violation')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    assigned_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    resolution TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_security_alerts_assigned_to ON security_alerts(assigned_to);

-- Enable Row Level Security
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON security_alerts
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON security_alerts TO authenticated;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_security_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_alerts_updated_at 
    BEFORE UPDATE ON security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_security_alerts_updated_at();

-- Insert some sample security alerts for testing
INSERT INTO security_alerts (id, type, severity, title, description, details, status) VALUES
('alert_001', 'suspicious_activity', 'medium', 'Unusual Payment Pattern Detected', 'Multiple failed payment attempts from same IP address', '{"ip_address": "192.168.1.100", "attempts": 5, "timeframe": "10 minutes"}', 'open'),
('alert_002', 'unusual_amount', 'high', 'Large Transaction Alert', 'Transaction amount exceeds normal threshold', '{"amount": 5000000, "threshold": 1000000, "customer_id": "customer_123"}', 'investigating'),
('alert_003', 'compliance_violation', 'critical', 'PCI DSS Compliance Check Failed', 'Payment card data handling violation detected', '{"violation_type": "card_data_storage", "severity": "critical"}', 'open')
ON CONFLICT (id) DO NOTHING;
