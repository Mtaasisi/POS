-- Create Missing Tables Step by Step
-- This script creates tables one by one to avoid column reference issues

-- Step 1: Create inventory_products table
CREATE TABLE IF NOT EXISTS inventory_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    model VARCHAR(100),
    category_id UUID,
    supplier_id UUID,
    product_code VARCHAR(100),
    barcode VARCHAR(100),
    minimum_stock_level INTEGER DEFAULT 0,
    maximum_stock_level INTEGER DEFAULT 1000,
    reorder_point INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    images TEXT[],
    specifications JSONB,
    warranty_period_months INTEGER DEFAULT 12,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID,
    product_id UUID,
    variant_id UUID,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create whatsapp_chats table
CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID,
    phone_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID,
    sender VARCHAR(50) NOT NULL,
    recipient VARCHAR(20),
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    media_url TEXT,
    template_id VARCHAR(100),
    variables JSONB,
    status VARCHAR(20) DEFAULT 'sent',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create scheduled_whatsapp_messages table
CREATE TABLE IF NOT EXISTS scheduled_whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    media_url TEXT,
    template_id VARCHAR(100),
    variables JSONB,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_by UUID,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    goal_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create staff_points table
CREATE TABLE IF NOT EXISTS staff_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    points INTEGER NOT NULL DEFAULT 0,
    reason VARCHAR(255),
    activity_type VARCHAR(50),
    reference_id UUID,
    reference_type VARCHAR(50),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Create customer_checkins table
CREATE TABLE IF NOT EXISTS customer_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID,
    checkin_type VARCHAR(50) DEFAULT 'visit',
    notes TEXT,
    staff_id UUID,
    checkin_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Enable Row Level Security (RLS)
ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_checkins ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies for all tables
CREATE POLICY "Allow all operations on inventory_products" ON inventory_products FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchase_orders" ON purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchase_order_items" ON purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on whatsapp_chats" ON whatsapp_chats FOR ALL USING (true);
CREATE POLICY "Allow all operations on whatsapp_messages" ON whatsapp_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on scheduled_whatsapp_messages" ON scheduled_whatsapp_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_goals" ON user_goals FOR ALL USING (true);
CREATE POLICY "Allow all operations on staff_points" ON staff_points FOR ALL USING (true);
CREATE POLICY "Allow all operations on customer_checkins" ON customer_checkins FOR ALL USING (true);

-- Step 12: Insert sample data
INSERT INTO communication_templates (name, type, content) VALUES
('Welcome Message', 'whatsapp', 'Hello {{customer_name}}! Welcome to our repair service. How can we help you today?'),
('Appointment Reminder', 'sms', 'Hi {{customer_name}}, your appointment is scheduled for {{appointment_time}}. Please arrive 10 minutes early.'),
('Repair Complete', 'whatsapp', 'Hi {{customer_name}}, your {{device_model}} repair is complete! You can pick it up anytime during business hours.')
ON CONFLICT DO NOTHING;

COMMIT; 