import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSamplePOSSales() {
  console.log('🛒 Adding sample POS sales for testing...\n');

  try {
    // Get a sample customer
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);

    if (customerError) {
      console.log('❌ Error fetching customers:', customerError.message);
      return;
    }

    const customerId = customers?.[0]?.id || null;
    console.log(`Using customer: ${customers?.[0]?.name || 'Walk-in Customer'}`);

    // Sample POS sales data
    const sampleSales = [
      {
        sale_number: `SALE-${Date.now()}-001`,
        customer_id: customerId,
        total_amount: 25000,
        payment_method: 'cash',
        status: 'completed',
        created_by: null,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        sale_number: `SALE-${Date.now()}-002`,
        customer_id: customerId,
        total_amount: 45000,
        payment_method: 'card',
        status: 'completed',
        created_by: null,
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      },
      {
        sale_number: `SALE-${Date.now()}-003`,
        customer_id: null, // Walk-in customer
        total_amount: 15000,
        payment_method: 'mpesa',
        status: 'completed',
        created_by: null,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
      },
      {
        sale_number: `SALE-${Date.now()}-004`,
        customer_id: customerId,
        total_amount: 75000,
        payment_method: 'transfer',
        status: 'completed',
        created_by: null,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        sale_number: `SALE-${Date.now()}-005`,
        customer_id: null, // Walk-in customer
        total_amount: 32000,
        payment_method: 'cash',
        status: 'completed',
        created_by: null,
        created_at: new Date().toISOString() // Now
      }
    ];

    console.log('1. Inserting sample POS sales...');
    
    const { data: insertedSales, error: insertError } = await supabase
      .from('lats_sales')
      .insert(sampleSales)
      .select();

    if (insertError) {
      console.log('❌ Error inserting sample sales:', insertError.message);
      return;
    }

    console.log(`✅ Successfully inserted ${insertedSales.length} sample sales`);

    // Display the inserted sales
    console.log('\n2. Sample sales inserted:');
    insertedSales.forEach((sale, index) => {
      console.log(`   ${index + 1}. ${sale.sale_number} - ${sale.total_amount} KES (${sale.payment_method})`);
    });

    // Verify total count
    console.log('\n3. Verifying total sales count...');
    const { count, error: countError } = await supabase
      .from('lats_sales')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error counting sales:', countError.message);
    } else {
      console.log(`✅ Total sales in database: ${count}`);
    }

    // Test payment tracking integration
    console.log('\n4. Testing payment tracking integration...');
    const { data: allPayments, error: paymentsError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name)
      `)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.log('❌ Error fetching payments:', paymentsError.message);
    } else {
      console.log(`✅ Payment tracking can read ${allPayments.length} sales`);
      
      const totalAmount = allPayments.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      console.log(`✅ Total amount from sales: ${totalAmount} KES`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addSamplePOSSales().then(() => {
  console.log('\n🏁 Sample POS sales added successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed to add sample POS sales:', error);
  process.exit(1);
});
