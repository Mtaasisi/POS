import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPOSIntegration() {
  console.log('🔍 Testing POS Sales Integration...\n');

  try {
    // 1. Check if sales_orders table exists and has data
    console.log('1. Checking sales_orders table...');
    const { data: salesOrders, error: salesError } = await supabase
      .from('sales_orders')
      .select('*')
      .limit(5);

    if (salesError) {
      console.log('❌ Error fetching sales_orders:', salesError.message);
    } else {
      console.log(`✅ Found ${salesOrders?.length || 0} sales orders`);
      if (salesOrders && salesOrders.length > 0) {
        console.log('Sample sales order:', salesOrders[0]);
      }
    }

    // 2. Check if customer_payments table exists and has data
    console.log('\n2. Checking customer_payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(5);

    if (paymentsError) {
      console.log('❌ Error fetching customer_payments:', paymentsError.message);
    } else {
      console.log(`✅ Found ${payments?.length || 0} customer payments`);
      if (payments && payments.length > 0) {
        console.log('Sample payment:', payments[0]);
      }
    }

    // 3. Test combined data fetch
    console.log('\n3. Testing combined data fetch...');
    
    // Fetch both types of data
    const [salesData, paymentsData] = await Promise.all([
      supabase.from('sales_orders').select('*, customers(name)').limit(10),
      supabase.from('customer_payments').select('*, customers(name), devices(brand, model)').limit(10)
    ]);

    let allPayments = [];

    // Transform regular payments
    if (!paymentsData.error && paymentsData.data) {
      const transformedPayments = paymentsData.data.map((payment) => ({
        ...payment,
        device_name: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined,
        customer_name: payment.customers?.name || undefined,
        source: 'device_payment'
      }));
      allPayments.push(...transformedPayments);
    }

    // Transform POS sales
    if (!salesData.error && salesData.data) {
      const transformedPOSSales = salesData.data.map((sale) => ({
        id: sale.id,
        customer_id: sale.customer_id,
        amount: sale.final_amount,
        method: sale.payment_method,
        device_id: null,
        payment_date: sale.order_date,
        payment_type: 'payment',
        status: sale.status === 'completed' ? 'completed' : 
                sale.status === 'pending' ? 'pending' : 'failed',
        created_by: sale.created_by,
        created_at: sale.created_at,
        device_name: undefined,
        customer_name: sale.customers?.name || undefined,
        source: 'pos_sale'
      }));
      allPayments.push(...transformedPOSSales);
    }

    // Sort by date
    allPayments.sort((a, b) => {
      const dateA = new Date(a.payment_date || a.created_at);
      const dateB = new Date(b.payment_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`✅ Combined ${allPayments.length} total payments/sales`);
    console.log(`   - Device payments: ${allPayments.filter(p => p.source === 'device_payment').length}`);
    console.log(`   - POS sales: ${allPayments.filter(p => p.source === 'pos_sale').length}`);

    if (allPayments.length > 0) {
      console.log('\nSample combined payment/sale:', allPayments[0]);
    }

    // 4. Test customer data with POS sales
    console.log('\n4. Testing customer data with POS sales...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);

    if (!customersError && customers && customers.length > 0) {
      const customerId = customers[0].id;
      console.log(`Testing with customer: ${customers[0].name} (${customerId})`);

      // Fetch customer's POS sales
      const { data: customerPOSSales, error: customerPOSSalesError } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('customer_id', customerId);

      if (customerPOSSalesError) {
        console.log('❌ Error fetching customer POS sales:', customerPOSSalesError.message);
      } else {
        console.log(`✅ Customer has ${customerPOSSales?.length || 0} POS sales`);
        if (customerPOSSales && customerPOSSales.length > 0) {
          console.log('Sample customer POS sale:', customerPOSSales[0]);
        }
      }
    }

    console.log('\n✅ POS Integration Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Sales Orders: ${salesOrders?.length || 0}`);
    console.log(`   - Customer Payments: ${payments?.length || 0}`);
    console.log(`   - Combined Total: ${allPayments.length}`);
    console.log(`   - POS Sales: ${allPayments.filter(p => p.source === 'pos_sale').length}`);
    console.log(`   - Device Payments: ${allPayments.filter(p => p.source === 'device_payment').length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPOSIntegration(); 