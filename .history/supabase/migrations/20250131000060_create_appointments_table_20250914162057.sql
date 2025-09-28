-- Create appointments table
-- Migration: 20250131000060_create_appointments_table.sql

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    technician_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('repair', 'consultation', 'pickup', 'delivery', 'maintenance')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_duration INTEGER DEFAULT 60, -- in minutes
    actual_duration INTEGER, -- in minutes
    notes TEXT,
    customer_notes TEXT,
    technician_notes TEXT,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    location VARCHAR(100) DEFAULT 'store',
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_device_id ON appointments(device_id);
CREATE INDEX IF NOT EXISTS idx_appointments_technician_id ON appointments(technician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_priority ON appointments(priority);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON appointments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON appointments FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Create appointment reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'sms', 'whatsapp', 'push')),
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for appointment reminders
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_reminder_time ON appointment_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_status ON appointment_reminders(status);

-- Enable RLS for appointment reminders
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointment reminders
CREATE POLICY "Enable read access for all users" ON appointment_reminders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON appointment_reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON appointment_reminders FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON appointment_reminders FOR DELETE USING (true);

-- Insert sample appointment data
INSERT INTO appointments (
    customer_id, 
    device_id, 
    technician_id, 
    appointment_type, 
    status, 
    scheduled_date, 
    estimated_duration, 
    notes, 
    priority,
    location
) VALUES (
    (SELECT id FROM customers LIMIT 1),
    NULL,
    NULL,
    'repair',
    'scheduled',
    NOW() + INTERVAL '1 day',
    60,
    'Screen repair needed',
    'medium',
    'store'
) ON CONFLICT DO NOTHING;
