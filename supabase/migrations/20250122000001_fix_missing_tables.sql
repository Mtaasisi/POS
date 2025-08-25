-- Migration: 20250122000001_fix_missing_tables.sql
-- Fix missing tables that are causing 404 errors

-- 1. Create whatsapp_notifications table
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID,
    customer_phone VARCHAR(20) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_id ON whatsapp_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_created_at ON whatsapp_notifications(created_at);

-- 3. Enable RLS and create policies
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_notifications;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON whatsapp_notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_notifications FOR UPDATE USING (true);

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_whatsapp_notifications_updated_at ON whatsapp_notifications;
CREATE TRIGGER update_whatsapp_notifications_updated_at 
    BEFORE UPDATE ON whatsapp_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_notifications_updated_at();

-- 5. Insert sample data for testing
INSERT INTO whatsapp_notifications (customer_id, customer_phone, template_type, message, status) VALUES
    (NULL, '+255123456789', 'welcome', 'Welcome to LATS!', 'sent'),
    (NULL, '+255987654321', 'order_confirmation', 'Your order has been confirmed!', 'delivered')
ON CONFLICT DO NOTHING;
