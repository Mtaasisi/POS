import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPOSSalesPage() {
  console.log('🧪 Testing POS Sales Page Functionality...\n');

  try {
    // 1. Test if sales_orders table exists
    console.log('1. Testing sales_orders table...');
    const { data: sales, error: salesError } = await supabase
      .from('sales_orders')
      .select('*')
      .limit(5);

    if (salesError) {
      console.log('❌ sales_orders table error:', salesError.message);
      console.log('\n📝 To fix this:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the SQL from ACTIVATE_POS_SALES.md');
      console.log('   4. Execute the script');
      return;
    } else {
      console.log(`✅ sales_orders table exists with ${sales?.length || 0} records`);
      if (sales && sales.length > 0) {
        console.log('Sample sales:');
        sales.forEach((sale, index) => {
          console.log(`   ${index + 1}. ${sale.status} - ${sale.final_amount} - ${sale.payment_method}`);
        });
      }
    }

    // 2. Test if customers table exists (needed for joins)
    console.log('\n2. Testing customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(3);

    if (customersError) {
      console.log('❌ customers table error:', customersError.message);
    } else {
      console.log(`✅ customers table exists with ${customers?.length || 0} records`);
    }

    // 3. Test the combined data fetch (like the page does)
    console.log('\n3. Testing combined data fetch...');
    const { data: combinedSales, error: combinedError } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customers(name)
      `)
      .order('created_at', { ascending: false });

    if (combinedError) {
      console.log('❌ Combined fetch error:', combinedError.message);
    } else {
      console.log(`✅ Combined fetch successful with ${combinedSales?.length || 0} records`);
      if (combinedSales && combinedSales.length > 0) {
        console.log('Sample combined data:');
        combinedSales.slice(0, 3).forEach((sale, index) => {
          console.log(`   ${index + 1}. ${sale.customers?.name || 'Unknown'} - ${sale.status} - ${sale.final_amount}`);
        });
      }
    }

    // 4. Test filtering functionality
    console.log('\n4. Testing filtering functionality...');
    const { data: completedSales, error: completedError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('status', 'completed');

    if (completedError) {
      console.log('❌ Filtering error:', completedError.message);
    } else {
      console.log(`✅ Filtering works: ${completedSales?.length || 0} completed sales`);
    }

    // 5. Test payment method filtering
    console.log('\n5. Testing payment method filtering...');
    const { data: cashSales, error: cashError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('payment_method', 'cash');

    if (cashError) {
      console.log('❌ Payment method filtering error:', cashError.message);
    } else {
      console.log(`✅ Payment method filtering works: ${cashSales?.length || 0} cash sales`);
    }

    console.log('\n🎉 POS Sales Page Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Sales Orders: ${sales?.length || 0}`);
    console.log(`   - Customers: ${customers?.length || 0}`);
    console.log(`   - Combined Data: ${combinedSales?.length || 0}`);
    console.log(`   - Completed Sales: ${completedSales?.length || 0}`);
    console.log(`   - Cash Sales: ${cashSales?.length || 0}`);

    if (sales && sales.length > 0) {
      console.log('\n✅ POS Sales Page is READY!');
      console.log('🌐 Navigate to: http://localhost:5173/pos-sales');
      console.log('📱 Or use the navigation menu: POS Sales');
    } else {
      console.log('\n⚠️  POS Sales Page needs data!');
      console.log('📝 Run the SQL script to create sample data');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPOSSalesPage(); 