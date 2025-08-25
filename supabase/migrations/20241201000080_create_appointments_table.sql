-- Create Appointments Table Migration
-- Migration: 20241201000080_create_appointments_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Customer Information
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email TEXT,
    
    -- Appointment Details
    service_type TEXT NOT NULL,
    service_description TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    
    -- Technician Assignment
    technician_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    technician_name TEXT,
    
    -- Status and Priority
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Location and Notes
    location_id UUID REFERENCES lats_store_locations(id) ON DELETE SET NULL,
    location_name TEXT,
    notes TEXT,
    
    -- Communication
    whatsapp_reminder_sent BOOLEAN DEFAULT false,
    sms_reminder_sent BOOLEAN DEFAULT false,
    email_reminder_sent BOOLEAN DEFAULT false,
    
    -- Timestamps
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_technician_id ON appointments(technician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_priority ON appointments(priority);
CREATE INDEX IF NOT EXISTS idx_appointments_location_id ON appointments(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all appointments" ON appointments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert appointments" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update appointments" ON appointments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete appointments" ON appointments
    FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_appointments_updated_at();

-- Insert default appointment types
INSERT INTO settings (key, value, description, category) VALUES
('appointments.service_types', '["Device Repair", "Device Diagnostics", "Software Installation", "Hardware Upgrade", "Data Recovery", "Virus Removal", "Screen Replacement", "Battery Replacement", "Consultation"]', 'Available appointment service types', 'appointments'),
('appointments.reminder_settings', '{"whatsapp_reminder_hours": 24, "sms_reminder_hours": 2, "email_reminder_hours": 48, "auto_confirm_hours": 1}', 'Appointment reminder settings', 'appointments')
ON CONFLICT (key) DO NOTHING;
