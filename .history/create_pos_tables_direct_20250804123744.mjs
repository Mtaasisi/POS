import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPOSTablesDirect() {
  console.log('🔧 Creating POS tables directly...\n');

  try {
    // First, let's check if the tables already exist
    console.log('1. Checking existing tables...');
    
    const { data: existingSales, error: salesError } = await supabase
      .from('sales_orders')
      .select('id')
      .limit(1);

    if (salesError && salesError.code === '42P01') {
      console.log('❌ sales_orders table does not exist - need to create it manually');
      console.log('📝 Please run the SQL script manually in your Supabase dashboard:');
      console.log('   - Go to your Supabase dashboard');
      console.log('   - Navigate to SQL Editor');
      console.log('   - Copy and paste the contents of create_pos_tables_manual.sql');
      console.log('   - Execute the script');
      return;
    } else if (salesError) {
      console.log('❌ Error checking sales_orders:', salesError.message);
      return;
    } else {
      console.log('✅ sales_orders table exists');
    }

    // Check if we have any data
    const { data: salesCount, error: countError } = await supabase
      .from('sales_orders')
      .select('id', { count: 'exact' });

    if (countError) {
      console.log('❌ Error counting sales:', countError.message);
    } else {
      console.log(`✅ Found ${salesCount?.length || 0} existing sales orders`);
    }

    // Insert sample data if no data exists
    if (!salesCount || salesCount.length === 0) {
      console.log('\n2. Inserting sample POS sales data...');
      
      // Get a customer ID first
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);

      if (customersError || !customers || customers.length === 0) {
        console.log('❌ No customers found - cannot create sample sales');
        return;
      }

      const customerId = customers[0].id;
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Insert sample sales
      const sampleSales = [
        {
          customer_id: customerId,
          order_date: now.toISOString().split('T')[0],
          status: 'completed',
          total_amount: 1500.00,
          discount_amount: 100.00,
          tax_amount: 150.00,
          shipping_cost: 50.00,
          final_amount: 1600.00,
          amount_paid: 1600.00,
          balance_due: 0.00,
          payment_method: 'cash',
          customer_type: 'retail',
          delivery_method: 'pickup',
          created_by: 'system'
        },
        {
          customer_id: customerId,
          order_date: yesterday.toISOString().split('T')[0],
          status: 'completed',
          total_amount: 2500.00,
          discount_amount: 200.00,
          tax_amount: 250.00,
          shipping_cost: 100.00,
          final_amount: 2650.00,
          amount_paid: 2650.00,
          balance_due: 0.00,
          payment_method: 'card',
          customer_type: 'retail',
          delivery_method: 'local_transport',
          delivery_address: '123 Main Street',
          delivery_city: 'Nairobi',
          created_by: 'system'
        },
        {
          customer_id: customerId,
          order_date: now.toISOString().split('T')[0],
          status: 'pending',
          total_amount: 800.00,
          discount_amount: 0.00,
          tax_amount: 80.00,
          shipping_cost: 0.00,
          final_amount: 880.00,
          amount_paid: 0.00,
          balance_due: 880.00,
          payment_method: 'payment_on_delivery',
          customer_type: 'retail',
          delivery_method: 'air_cargo',
          delivery_address: '456 Business Ave',
          delivery_city: 'Mombasa',
          delivery_notes: 'Please deliver during business hours',
          created_by: 'system'
        }
      ];

      const { data: insertedSales, error: insertError } = await supabase
        .from('sales_orders')
        .insert(sampleSales)
        .select();

      if (insertError) {
        console.log('❌ Error inserting sample sales:', insertError.message);
      } else {
        console.log(`✅ Successfully inserted ${insertedSales?.length || 0} sample sales`);
        console.log('Sample sales created:');
        insertedSales?.forEach((sale, index) => {
          console.log(`   ${index + 1}. ${sale.status} - ${sale.final_amount} - ${sale.payment_method}`);
        });
      }
    }

    console.log('\n✅ POS Tables Setup Complete!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to /pos-sales in your app');
    console.log('3. You should see the POS sales data with analytics');

  } catch (error) {
    console.error('❌ Error setting up POS tables:', error);
  }
}

createPOSTablesDirect(); 