-- Complete Setup for All Missing Tables
-- This script creates all the missing tables that your app expects

-- =============================================
-- STEP 1: CREATE CORE TABLES
-- =============================================

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  city TEXT,
  location_description TEXT,
  national_id TEXT,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  loyalty_level TEXT NOT NULL DEFAULT 'bronze' CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum')),
  color_tag TEXT NOT NULL DEFAULT 'normal' CHECK (color_tag IN ('normal', 'vip', 'complainer')),
  referred_by TEXT,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  whatsapp TEXT,
  birth_month TEXT,
  birth_day TEXT,
  referral_source TEXT,
  initial_notes TEXT,
  total_returns INTEGER DEFAULT 0,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  issue_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing', 'repair-complete', 'returned-to-customer-care', 'done', 'failed')),
  assigned_to TEXT,
  estimated_hours INTEGER,
  expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  warranty_start TIMESTAMP WITH TIME ZONE,
  warranty_end TIMESTAMP WITH TIME ZONE,
  warranty_status TEXT,
  repair_count INTEGER DEFAULT 0,
  last_return_date TIMESTAMP WITH TIME ZONE,
  unlock_code TEXT,
  repair_cost DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  device_cost DECIMAL(10,2),
  diagnosis_required BOOLEAN DEFAULT false,
  device_notes TEXT,
  device_condition JSONB,
  device_images JSONB,
  accessories_confirmed BOOLEAN DEFAULT false,
  problem_confirmed BOOLEAN DEFAULT false,
  privacy_confirmed BOOLEAN DEFAULT false,
  imei TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: CREATE DEVICE-RELATED TABLES
-- =============================================

-- Create device_checklists table
CREATE TABLE IF NOT EXISTS device_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL DEFAULT 'repair' CHECK (checklist_type IN ('repair', 'diagnostic', 'quality_check', 'handover')),
  items JSONB NOT NULL DEFAULT '[]',
  completed_items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_attachments table
CREATE TABLE IF NOT EXISTS device_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: CREATE INVENTORY TABLES
-- =============================================

-- Create inventory_products table
CREATE TABLE IF NOT EXISTS inventory_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  sku TEXT UNIQUE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  supplier TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spare_parts table
CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('screen', 'battery', 'camera', 'speaker', 'microphone', 'charging_port', 'motherboard', 'other')),
  brand TEXT,
  model_compatibility TEXT[],
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  supplier TEXT,
  part_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 4: CREATE COMMUNICATION TABLES
-- =============================================

-- Create communication_templates table
CREATE TABLE IF NOT EXISTS communication_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'whatsapp')),
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_chats table
CREATE TABLE IF NOT EXISTS whatsapp_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video')),
  content TEXT,
  media_url TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 5: CREATE USER MANAGEMENT TABLES
-- =============================================

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_daily_goals table
CREATE TABLE IF NOT EXISTS user_daily_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  devices_repaired INTEGER NOT NULL DEFAULT 0,
  customers_served INTEGER NOT NULL DEFAULT 0,
  revenue_target DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_achieved DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create staff_points table
CREATE TABLE IF NOT EXISTS staff_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  awarded_by TEXT,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_checkins table
CREATE TABLE IF NOT EXISTS customer_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  checkin_type TEXT NOT NULL CHECK (checkin_type IN ('drop_off', 'pickup', 'follow_up')),
  notes TEXT,
  checked_in_by TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 6: CREATE INDEXES
-- =============================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_level ON customers(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Device indexes
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_to ON devices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at);

-- Device checklist indexes
CREATE INDEX IF NOT EXISTS idx_device_checklists_device_id ON device_checklists(device_id);
CREATE INDEX IF NOT EXISTS idx_device_checklists_status ON device_checklists(status);
CREATE INDEX IF NOT EXISTS idx_device_checklists_type ON device_checklists(checklist_type);
CREATE INDEX IF NOT EXISTS idx_device_checklists_assigned_to ON device_checklists(assigned_to);

-- Device attachment indexes
CREATE INDEX IF NOT EXISTS idx_device_attachments_device_id ON device_attachments(device_id);
CREATE INDEX IF NOT EXISTS idx_device_attachments_uploaded_at ON device_attachments(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_device_attachments_file_type ON device_attachments(file_type);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_products_category ON inventory_products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_products_brand ON inventory_products(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_products_active ON inventory_products(is_active);

CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_brand ON spare_parts(brand);
CREATE INDEX IF NOT EXISTS idx_spare_parts_active ON spare_parts(is_active);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON communication_templates(type);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON communication_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_customer_id ON whatsapp_chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_phone_number ON whatsapp_chats(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at);

-- User management indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_type ON user_goals(goal_type);

CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_date ON user_daily_goals(date);

CREATE INDEX IF NOT EXISTS idx_staff_points_user_id ON staff_points(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_points_awarded_at ON staff_points(awarded_at);

CREATE INDEX IF NOT EXISTS idx_customer_checkins_customer_id ON customer_checkins(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_checkins_checked_in_at ON customer_checkins(checked_in_at);

-- =============================================
-- STEP 7: CREATE TRIGGERS
-- =============================================

-- Create trigger function for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_checklists_updated_at 
    BEFORE UPDATE ON device_checklists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_attachments_updated_at 
    BEFORE UPDATE ON device_attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_products_updated_at 
    BEFORE UPDATE ON inventory_products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spare_parts_updated_at 
    BEFORE UPDATE ON spare_parts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_templates_updated_at 
    BEFORE UPDATE ON communication_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_chats_updated_at 
    BEFORE UPDATE ON whatsapp_chats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at 
    BEFORE UPDATE ON user_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_goals_updated_at 
    BEFORE UPDATE ON user_daily_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_checkins ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all operations for now)
-- You can customize these policies based on your security requirements

-- Customers policies
CREATE POLICY "Users can view customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Users can insert customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Users can delete customers" ON customers FOR DELETE USING (true);

-- Devices policies
CREATE POLICY "Users can view devices" ON devices FOR SELECT USING (true);
CREATE POLICY "Users can insert devices" ON devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update devices" ON devices FOR UPDATE USING (true);
CREATE POLICY "Users can delete devices" ON devices FOR DELETE USING (true);

-- Device checklists policies
CREATE POLICY "Users can view device checklists" ON device_checklists FOR SELECT USING (true);
CREATE POLICY "Users can insert device checklists" ON device_checklists FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update device checklists" ON device_checklists FOR UPDATE USING (true);
CREATE POLICY "Users can delete device checklists" ON device_checklists FOR DELETE USING (true);

-- Device attachments policies
CREATE POLICY "Users can view device attachments" ON device_attachments FOR SELECT USING (true);
CREATE POLICY "Users can insert device attachments" ON device_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update device attachments" ON device_attachments FOR UPDATE USING (true);
CREATE POLICY "Users can delete device attachments" ON device_attachments FOR DELETE USING (true);

-- Inventory policies
CREATE POLICY "Users can view inventory products" ON inventory_products FOR SELECT USING (true);
CREATE POLICY "Users can insert inventory products" ON inventory_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update inventory products" ON inventory_products FOR UPDATE USING (true);
CREATE POLICY "Users can delete inventory products" ON inventory_products FOR DELETE USING (true);

CREATE POLICY "Users can view spare parts" ON spare_parts FOR SELECT USING (true);
CREATE POLICY "Users can insert spare parts" ON spare_parts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update spare parts" ON spare_parts FOR UPDATE USING (true);
CREATE POLICY "Users can delete spare parts" ON spare_parts FOR DELETE USING (true);

-- Communication policies
CREATE POLICY "Users can view communication templates" ON communication_templates FOR SELECT USING (true);
CREATE POLICY "Users can insert communication templates" ON communication_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update communication templates" ON communication_templates FOR UPDATE USING (true);
CREATE POLICY "Users can delete communication templates" ON communication_templates FOR DELETE USING (true);

CREATE POLICY "Users can view whatsapp chats" ON whatsapp_chats FOR SELECT USING (true);
CREATE POLICY "Users can insert whatsapp chats" ON whatsapp_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update whatsapp chats" ON whatsapp_chats FOR UPDATE USING (true);
CREATE POLICY "Users can delete whatsapp chats" ON whatsapp_chats FOR DELETE USING (true);

CREATE POLICY "Users can view whatsapp messages" ON whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert whatsapp messages" ON whatsapp_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update whatsapp messages" ON whatsapp_messages FOR UPDATE USING (true);
CREATE POLICY "Users can delete whatsapp messages" ON whatsapp_messages FOR DELETE USING (true);

-- User management policies
CREATE POLICY "Users can view user goals" ON user_goals FOR SELECT USING (true);
CREATE POLICY "Users can insert user goals" ON user_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update user goals" ON user_goals FOR UPDATE USING (true);
CREATE POLICY "Users can delete user goals" ON user_goals FOR DELETE USING (true);

CREATE POLICY "Users can view user daily goals" ON user_daily_goals FOR SELECT USING (true);
CREATE POLICY "Users can insert user daily goals" ON user_daily_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update user daily goals" ON user_daily_goals FOR UPDATE USING (true);
CREATE POLICY "Users can delete user daily goals" ON user_daily_goals FOR DELETE USING (true);

CREATE POLICY "Users can view staff points" ON staff_points FOR SELECT USING (true);
CREATE POLICY "Users can insert staff points" ON staff_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update staff points" ON staff_points FOR UPDATE USING (true);
CREATE POLICY "Users can delete staff points" ON staff_points FOR DELETE USING (true);

CREATE POLICY "Users can view customer checkins" ON customer_checkins FOR SELECT USING (true);
CREATE POLICY "Users can insert customer checkins" ON customer_checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update customer checkins" ON customer_checkins FOR UPDATE USING (true);
CREATE POLICY "Users can delete customer checkins" ON customer_checkins FOR DELETE USING (true);

-- =============================================
-- STEP 9: VERIFY CREATION
-- =============================================

-- Show all created tables
SELECT 
    table_name,
    '✅ CREATED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'customers', 'devices', 'device_checklists', 'device_attachments',
        'inventory_products', 'spare_parts', 'communication_templates',
        'whatsapp_chats', 'whatsapp_messages', 'user_goals', 'user_daily_goals',
        'staff_points', 'customer_checkins'
    )
ORDER BY table_name; 