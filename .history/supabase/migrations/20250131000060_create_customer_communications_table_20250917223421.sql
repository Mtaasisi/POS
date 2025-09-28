-- Migration: 20250131000060_create_customer_communications_table.sql
-- Create customer_communications table for tracking customer communications

-- =====================================================
-- CUSTOMER COMMUNICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    
    -- Communication details
    type VARCHAR(20) NOT NULL CHECK (type IN ('sms', 'whatsapp', 'email', 'phone_call')),
    message TEXT,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
    
    -- Contact information
    phone_number VARCHAR(20),
    email VARCHAR(255),
    
    -- Metadata
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- User tracking
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_device_id ON customer_communications(device_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_type ON customer_communications(type);
CREATE INDEX IF NOT EXISTS idx_customer_communications_status ON customer_communications(status);
CREATE INDEX IF NOT EXISTS idx_customer_communications_sent_at ON customer_communications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_communications_phone_number ON customer_communications(phone_number);

-- Enable Row Level Security
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own communications" ON customer_communications
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM customers WHERE id = customer_id
        ) OR
        auth.uid() = sent_by
    );

CREATE POLICY "Users can insert communications" ON customer_communications
    FOR INSERT WITH CHECK (
        auth.uid() = sent_by OR
        auth.uid() IN (
            SELECT user_id FROM customers WHERE id = customer_id
        )
    );

CREATE POLICY "Users can update their own communications" ON customer_communications
    FOR UPDATE USING (
        auth.uid() = sent_by OR
        auth.uid() IN (
            SELECT user_id FROM customers WHERE id = customer_id
        )
    );

-- Add comments for documentation
COMMENT ON TABLE customer_communications IS 'Stores all customer communication logs including SMS, WhatsApp, email, and phone calls';
COMMENT ON COLUMN customer_communications.type IS 'Type of communication: sms, whatsapp, email, phone_call';
COMMENT ON COLUMN customer_communications.status IS 'Delivery status of the communication';
COMMENT ON COLUMN customer_communications.message IS 'The actual message content sent to the customer';
COMMENT ON COLUMN customer_communications.phone_number IS 'Phone number used for SMS/WhatsApp/calls';
COMMENT ON COLUMN customer_communications.email IS 'Email address used for email communications';
COMMENT ON COLUMN customer_communications.sent_by IS 'User who initiated the communication';
COMMENT ON COLUMN customer_communications.retry_count IS 'Number of retry attempts for failed communications';
