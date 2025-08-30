const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying appointments migration...');

    // Create appointments table
    const { error: appointmentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
          service_type VARCHAR(100) NOT NULL,
          appointment_date DATE NOT NULL,
          appointment_time TIME NOT NULL,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
          technician_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
          notes TEXT,
          duration_minutes INTEGER DEFAULT 60,
          priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (appointmentsError) {
      console.error('❌ Error creating appointments table:', appointmentsError);
      return;
    }

    console.log('✅ Appointments table created');

    // Create customer revenue table
    const { error: revenueError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customer_revenue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
          revenue_type VARCHAR(50) NOT NULL CHECK (revenue_type IN ('device_repair', 'pos_sale', 'service_fee', 'consultation')),
          amount DECIMAL(10,2) NOT NULL,
          transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          order_id VARCHAR(100),
          device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (revenueError) {
      console.error('❌ Error creating customer_revenue table:', revenueError);
      return;
    }

    console.log('✅ Customer revenue table created');

    // Create indexes
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
        CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
        CREATE INDEX IF NOT EXISTS idx_customer_revenue_customer_id ON customer_revenue(customer_id);
        CREATE INDEX IF NOT EXISTS idx_customer_revenue_type ON customer_revenue(revenue_type);
      `
    });

    if (indexesError) {
      console.error('❌ Error creating indexes:', indexesError);
      return;
    }

    console.log('✅ Indexes created');

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE customer_revenue ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return;
    }

    console.log('✅ RLS enabled');

    // Create RLS policies
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can view appointments" ON appointments FOR SELECT USING (true);
        CREATE POLICY "Users can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
        CREATE POLICY "Users can update appointments" ON appointments FOR UPDATE USING (true);
        CREATE POLICY "Users can delete appointments" ON appointments FOR DELETE USING (true);
        
        CREATE POLICY "Users can view customer revenue" ON customer_revenue FOR SELECT USING (true);
        CREATE POLICY "Users can insert customer revenue" ON customer_revenue FOR INSERT WITH CHECK (true);
        CREATE POLICY "Users can update customer revenue" ON customer_revenue FOR UPDATE USING (true);
        CREATE POLICY "Users can delete customer revenue" ON customer_revenue FOR DELETE USING (true);
      `
    });

    if (policiesError) {
      console.error('❌ Error creating policies:', policiesError);
      return;
    }

    console.log('✅ RLS policies created');

    // Insert sample data
    const { error: sampleDataError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO appointments (customer_id, service_type, appointment_date, appointment_time, status, notes, priority)
        SELECT 
          c.id,
          CASE (random() * 3)::int
            WHEN 0 THEN 'Device Repair'
            WHEN 1 THEN 'Device Diagnosis'
            WHEN 2 THEN 'Software Installation'
            ELSE 'Hardware Upgrade'
          END,
          CURRENT_DATE + (random() * 30)::int * INTERVAL '1 day',
          '10:00:00'::time + (random() * 8)::int * INTERVAL '1 hour',
          CASE (random() * 3)::int
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'confirmed'
            WHEN 2 THEN 'completed'
            ELSE 'cancelled'
          END,
          'Sample appointment for testing',
          CASE (random() * 2)::int
            WHEN 0 THEN 'low'
            WHEN 1 THEN 'medium'
            ELSE 'high'
          END
        FROM customers c
        WHERE c.is_active = true
        LIMIT 5;
      `
    });

    if (sampleDataError) {
      console.error('❌ Error inserting sample appointments:', sampleDataError);
    } else {
      console.log('✅ Sample appointments inserted');
    }

    // Insert sample revenue data
    const { error: sampleRevenueError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO customer_revenue (customer_id, revenue_type, amount, description)
        SELECT 
          c.id,
          CASE (random() * 1)::int
            WHEN 0 THEN 'device_repair'
            ELSE 'pos_sale'
          END,
          (random() * 1000 + 50)::decimal(10,2),
          'Sample revenue transaction'
        FROM customers c
        WHERE c.is_active = true
        LIMIT 10;
      `
    });

    if (sampleRevenueError) {
      console.error('❌ Error inserting sample revenue:', sampleRevenueError);
    } else {
      console.log('✅ Sample revenue data inserted');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();
