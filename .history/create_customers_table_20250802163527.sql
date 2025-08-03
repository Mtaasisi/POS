-- Create customers table for the repair shop management system
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    city VARCHAR(100),
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    loyalty_level VARCHAR(20) DEFAULT 'bronze' CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum')),
    color_tag VARCHAR(20) DEFAULT 'normal' CHECK (color_tag IN ('normal', 'vip', 'complainer', 'purchased')),
    referred_by UUID,
    total_spent DECIMAL(12,2) DEFAULT 0,
    points INTEGER DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    whatsapp VARCHAR(20),
    birth_month INTEGER CHECK (birth_month >= 1 AND birth_month <= 12),
    birth_day INTEGER CHECK (birth_day >= 1 AND birth_day <= 31),
    referral_source VARCHAR(100),
    initial_notes TEXT,
    total_returns INTEGER DEFAULT 0,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_level ON customers(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);

-- Create trigger for updated_at column
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for customers updated_at column
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_customers_updated_at();

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers table
CREATE POLICY "Enable read access for all users" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample customers for testing
INSERT INTO customers (name, email, phone, gender, city, loyalty_level, color_tag, total_spent, points, last_visit, is_active) VALUES
('John Doe', 'john.doe@email.com', '+255123456789', 'male', 'Dar es Salaam', 'gold', 'vip', 150000, 500, NOW() - INTERVAL '2 days', true),
('Jane Smith', 'jane.smith@email.com', '+255987654321', 'female', 'Nairobi', 'silver', 'normal', 75000, 250, NOW() - INTERVAL '5 days', true),
('Mike Johnson', 'mike.johnson@email.com', '+255555123456', 'male', 'Mombasa', 'bronze', 'normal', 25000, 100, NOW() - INTERVAL '1 week', true),
('Sarah Wilson', 'sarah.wilson@email.com', '+255777888999', 'female', 'Arusha', 'platinum', 'vip', 300000, 1000, NOW() - INTERVAL '1 day', true),
('David Brown', 'david.brown@email.com', '+255111222333', 'male', 'Dodoma', 'bronze', 'normal', 15000, 50, NOW() - INTERVAL '2 weeks', true),
('Lisa Davis', 'lisa.davis@email.com', '+255444555666', 'female', 'Tanga', 'silver', 'normal', 60000, 200, NOW() - INTERVAL '3 days', true),
('Robert Miller', 'robert.miller@email.com', '+255888999000', 'male', 'Morogoro', 'bronze', 'complainer', 10000, 25, NOW() - INTERVAL '1 month', false),
('Emma Wilson', 'emma.wilson@email.com', '+255222333444', 'female', 'Iringa', 'gold', 'vip', 120000, 400, NOW() - INTERVAL '4 days', true),
('James Taylor', 'james.taylor@email.com', '+255666777888', 'male', 'Mbeya', 'silver', 'normal', 45000, 150, NOW() - INTERVAL '1 week', true),
('Maria Garcia', 'maria.garcia@email.com', '+255333444555', 'female', 'Songea', 'bronze', 'normal', 20000, 75, NOW() - INTERVAL '2 weeks', true);

-- Create customer_notes table
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customer_notes
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);

-- Enable RLS for customer_notes
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_notes
CREATE POLICY "Enable read access for all users" ON customer_notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON customer_notes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON customer_notes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON customer_notes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create promo_messages table
CREATE TABLE IF NOT EXISTS promo_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for promo_messages
CREATE INDEX IF NOT EXISTS idx_promo_messages_customer_id ON promo_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_promo_messages_sent_at ON promo_messages(sent_at);

-- Enable RLS for promo_messages
ALTER TABLE promo_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for promo_messages
CREATE POLICY "Enable read access for all users" ON promo_messages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON promo_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON promo_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON promo_messages
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create customer_payments table
CREATE TABLE IF NOT EXISTS customer_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customer_payments
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_date ON customer_payments(payment_date);

-- Enable RLS for customer_payments
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_payments
CREATE POLICY "Enable read access for all users" ON customer_payments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON customer_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON customer_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON customer_payments
    FOR DELETE USING (auth.role() = 'authenticated');

SELECT 'Customers table and related tables created successfully!' as status; 