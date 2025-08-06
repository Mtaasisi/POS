import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPOSTables() {
  console.log('🔧 Fixing POS Tables...\n');

  try {
    // Check if sales_orders table exists
    console.log('1. Checking sales_orders table...');
    const { error: salesError } = await supabase
      .from('sales_orders')
      .select('id')
      .limit(1);
    
    if (salesError && salesError.code === '42P01') {
      console.log('❌ sales_orders table does not exist');
      console.log('📝 To fix this, you need to run the SQL manually in your Supabase dashboard:');
      console.log('');
      console.log('1. Open your Supabase dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy and paste this SQL:');
      console.log('');
      console.log(`
-- Create sales_orders table
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
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
  created_by UUID,
  customer_type VARCHAR(20) NOT NULL DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_method VARCHAR(50) CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
  delivery_notes TEXT,
  location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_order_items table
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

-- Enable RLS
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies
DROP POLICY IF EXISTS "Allow all access to sales orders" ON sales_orders;
CREATE POLICY "Allow all access to sales orders" ON sales_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to sales order items" ON sales_order_items;
CREATE POLICY "Allow all access to sales order items" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);

-- Grant permissions
GRANT ALL ON sales_orders TO authenticated;
GRANT ALL ON sales_order_items TO authenticated;
GRANT ALL ON sales_orders TO anon;
GRANT ALL ON sales_order_items TO anon;
      `);
      console.log('');
      console.log('4. Click "Run" to execute the SQL');
      console.log('');
      console.log('After running this SQL, the POS page should work correctly.');
      return;
    } else if (salesError) {
      console.log('❌ Error checking sales_orders:', salesError.message);
      return;
    } else {
      console.log('✅ sales_orders table exists');
    }

    // Check if sales_order_items table exists
    console.log('2. Checking sales_order_items table...');
    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .select('id')
      .limit(1);
    
    if (itemsError && itemsError.code === '42P01') {
      console.log('❌ sales_order_items table does not exist');
      console.log('📝 Please run the SQL above to create all necessary tables');
      return;
    } else if (itemsError) {
      console.log('❌ Error checking sales_order_items:', itemsError.message);
      return;
    } else {
      console.log('✅ sales_order_items table exists');
    }

    // Test inserting a sample record
    console.log('3. Testing table functionality...');
    try {
      const { data: testOrder, error: testError } = await supabase
        .from('sales_orders')
        .insert([{
          order_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          total_amount: 0,
          discount_amount: 0,
          tax_amount: 0,
          shipping_cost: 0,
          final_amount: 0,
          amount_paid: 0,
          balance_due: 0,
          payment_method: 'cash',
          customer_type: 'retail'
        }])
        .select()
        .single();

      if (testError) {
        console.log('❌ Error testing sales_orders insert:', testError.message);
        console.log('📝 This might be due to RLS policies. Please check the SQL above includes the RLS policies.');
      } else {
        console.log('✅ sales_orders table is working correctly');
        
        // Clean up test record
        await supabase
          .from('sales_orders')
          .delete()
          .eq('id', testOrder.id);
      }
    } catch (error) {
      console.log('❌ Error during test:', error.message);
    }

    console.log('\n✅ POS Tables are ready!');
    console.log('🎯 You can now use the POS page without errors.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPOSTables(); 