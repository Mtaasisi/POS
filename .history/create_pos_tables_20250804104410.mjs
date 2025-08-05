import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPOSTables() {
  console.log('🔧 Creating POS tables...\n');

  try {
    // Create sales_orders table
    console.log('1. Creating sales_orders table...');
    const { error: salesOrdersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sales_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID REFERENCES customers(id),
          order_date DATE NOT NULL DEFAULT CURRENT_DATE,
          status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'on_hold', 'cancelled', 'partially_paid', 'delivered', 'payment_on_delivery')),
          total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
          discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
          tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
          shipping_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
          final_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
          amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
          balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
          payment_method VARCHAR(50) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')),
          created_by UUID REFERENCES auth.users(id),
          customer_type VARCHAR(20) NOT NULL DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
          delivery_address TEXT,
          delivery_city VARCHAR(100),
          delivery_method VARCHAR(50) CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
          delivery_notes TEXT,
          location_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (salesOrdersError) {
      console.log('❌ Error creating sales_orders table:', salesOrdersError.message);
    } else {
      console.log('✅ sales_orders table created successfully');
    }

    // Create sales_order_items table
    console.log('\n2. Creating sales_order_items table...');
    const { error: salesOrderItemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sales_order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
          product_id UUID,
          variant_id UUID,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
          unit_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
          item_total DECIMAL(15,2) NOT NULL DEFAULT 0,
          is_external_product BOOLEAN DEFAULT false,
          external_product_details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (salesOrderItemsError) {
      console.log('❌ Error creating sales_order_items table:', salesOrderItemsError.message);
    } else {
      console.log('✅ sales_order_items table created successfully');
    }

    // Enable RLS
    console.log('\n3. Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
        ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.log('❌ Error enabling RLS:', rlsError.message);
    } else {
      console.log('✅ RLS enabled successfully');
    }

    // Create RLS policies
    console.log('\n4. Creating RLS policies...');
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Allow all access to sales orders" ON sales_orders;
        CREATE POLICY "Allow all access to sales orders" ON sales_orders FOR ALL USING (true) WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow all access to sales order items" ON sales_order_items;
        CREATE POLICY "Allow all access to sales order items" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);
      `
    });

    if (policiesError) {
      console.log('❌ Error creating RLS policies:', policiesError.message);
    } else {
      console.log('✅ RLS policies created successfully');
    }

    // Create indexes
    console.log('\n5. Creating indexes...');
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
        CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);
      `
    });

    if (indexesError) {
      console.log('❌ Error creating indexes:', indexesError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Insert sample data
    console.log('\n6. Inserting sample data...');
    const { error: sampleDataError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO sales_orders (customer_id, order_date, status, total_amount, final_amount, amount_paid, payment_method, customer_type)
        VALUES 
          ('d4220f6f-80a6-43ac-bd09-217b0fcef040', CURRENT_DATE, 'completed', 1500.00, 1500.00, 1500.00, 'cash', 'retail'),
          ('d4220f6f-80a6-43ac-bd09-217b0fcef040', CURRENT_DATE - INTERVAL '1 day', 'completed', 2500.00, 2500.00, 2500.00, 'card', 'retail')
        ON CONFLICT DO NOTHING;
      `
    });

    if (sampleDataError) {
      console.log('❌ Error inserting sample data:', sampleDataError.message);
    } else {
      console.log('✅ Sample data inserted successfully');
    }

    console.log('\n✅ POS Tables Creation Complete!');

  } catch (error) {
    console.error('❌ Error creating POS tables:', error);
  }
}

createPOSTables(); 