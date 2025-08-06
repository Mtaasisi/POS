import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPOSTablesDirect() {
  console.log('🔧 Creating POS tables directly...\n');

  try {
    // 1. Create sales_orders table
    console.log('1. Creating sales_orders table...');
    const { error: salesOrdersError } = await supabase
      .from('sales_orders')
      .select('id')
      .limit(1);
    
    if (salesOrdersError && salesOrdersError.code === '42P01') {
      // Table doesn't exist, create it via SQL
      console.log('Table does not exist, creating via SQL...');
      const { error: createError } = await supabase.rpc('exec_sql', {
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
      
      if (createError) {
        console.log('❌ Error creating sales_orders table:', createError.message);
      } else {
        console.log('✅ sales_orders table created successfully');
      }
    } else {
      console.log('✅ sales_orders table already exists');
    }

    // 2. Create sales_order_items table
    console.log('2. Creating sales_order_items table...');
    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .select('id')
      .limit(1);
    
    if (itemsError && itemsError.code === '42P01') {
      console.log('Table does not exist, creating via SQL...');
      const { error: createError } = await supabase.rpc('exec_sql', {
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
      
      if (createError) {
        console.log('❌ Error creating sales_order_items table:', createError.message);
      } else {
        console.log('✅ sales_order_items table created successfully');
      }
    } else {
      console.log('✅ sales_order_items table already exists');
    }

    // 3. Enable RLS
    console.log('3. Enabling RLS...');
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

    // 4. Create RLS policies
    console.log('4. Creating RLS policies...');
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Allow all access to sales orders" ON sales_orders;
        CREATE POLICY "Allow all access to sales orders" ON sales_orders FOR ALL USING (true) WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow all access to sales order items" ON sales_order_items;
        CREATE POLICY "Allow all access to sales order items" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);
      `
    });
    
    if (policyError) {
      console.log('❌ Error creating RLS policies:', policyError.message);
    } else {
      console.log('✅ RLS policies created successfully');
    }

    // 5. Create indexes
    console.log('5. Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
        CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);
      `
    });
    
    if (indexError) {
      console.log('❌ Error creating indexes:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // 6. Grant permissions
    console.log('6. Granting permissions...');
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: `
        GRANT ALL ON sales_orders TO authenticated;
        GRANT ALL ON sales_order_items TO authenticated;
        GRANT ALL ON sales_orders TO anon;
        GRANT ALL ON sales_order_items TO anon;
      `
    });
    
    if (grantError) {
      console.log('❌ Error granting permissions:', grantError.message);
    } else {
      console.log('✅ Permissions granted successfully');
    }

    console.log('\n✅ POS Tables Creation Complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createPOSTablesDirect(); 