-- Create compliance_checks table for payment security monitoring
-- Migration: 20250131000014_create_compliance_checks_table.sql

-- Create compliance_checks table
CREATE TABLE IF NOT EXISTS compliance_checks (
    id VARCHAR(255) PRIMARY KEY,
    check_type VARCHAR(50) NOT NULL CHECK (check_type IN ('pci_dss', 'gdpr', 'aml', 'kyc', 'data_retention', 'audit_trail')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'pending')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_compliance_checks_check_type ON compliance_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_created_at ON compliance_checks(created_at);

-- Enable Row Level Security
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON compliance_checks
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON compliance_checks TO authenticated;

-- Create trigger for updating timestamps
CREATE TRIGGER update_compliance_checks_updated_at 
    BEFORE UPDATE ON compliance_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
