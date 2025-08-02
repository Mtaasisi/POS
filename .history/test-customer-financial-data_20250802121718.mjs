import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerData() {
  console.log('🔍 Testing Customer Data in Financial System...\n');

  try {
    // Test 1: Check customers table
    console.log('📋 Test 1: Checking customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, phone, email, total_spent')
      .limit(5);

    if (customersError) {
      console.error('❌ Error fetching customers:', customersError);
    } else {
      console.log(`✅ Found ${customers?.length || 0} customers:`);
      customers?.forEach(customer => {
        console.log(`   - ${customer.name} (${customer.phone}) - Spent: $${customer.total_spent || 0}`);
      });
    }

    // Test 2: Check customer_payments table
    console.log('\n💰 Test 2: Checking customer_payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select(`
        *,
        customers(name, phone),
        devices(brand, model)
      `)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
    } else {
      console.log(`✅ Found ${payments?.length || 0} payments:`);
      payments?.forEach(payment => {
        const customerName = payment.customers?.name || 'Unknown Customer';
        const deviceName = payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : 'No Device';
        console.log(`   - ${customerName}: $${payment.amount} (${payment.method}) - ${deviceName}`);
      });
    }

    // Test 3: Check devices table for revenue
    console.log('\n📱 Test 3: Checking devices table for revenue...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, brand, model, repair_cost, device_cost, created_at')
      .limit(5);

    if (devicesError) {
      console.error('❌ Error fetching devices:', devicesError);
    } else {
      console.log(`✅ Found ${devices?.length || 0} devices with revenue data:`);
      devices?.forEach(device => {
        const totalRevenue = (device.repair_cost || 0) + (device.device_cost || 0);
        console.log(`   - ${device.brand} ${device.model}: $${totalRevenue} (Repair: $${device.repair_cost || 0}, Device: $${device.device_cost || 0})`);
      });
    }

    // Test 4: Calculate total revenue from payments
    console.log('\n📊 Test 4: Calculating total revenue from payments...');
    if (payments && payments.length > 0) {
      const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const completedPayments = payments.filter(p => p.status === 'completed');
      const pendingPayments = payments.filter(p => p.status === 'pending');
      
      console.log(`✅ Revenue Summary:`);
      console.log(`   - Total Revenue: $${totalRevenue}`);
      console.log(`   - Completed Payments: ${completedPayments.length}`);
      console.log(`   - Pending Payments: ${pendingPayments.length}`);
      console.log(`   - Average Payment: $${totalRevenue / payments.length}`);
    }

    // Test 5: Check customer-payment relationships
    console.log('\n🔗 Test 5: Checking customer-payment relationships...');
    if (payments && customers) {
      const customerPaymentMap = new Map();
      
      payments.forEach(payment => {
        const customerId = payment.customer_id;
        const customerName = payment.customers?.name || 'Unknown';
        
        if (!customerPaymentMap.has(customerId)) {
          customerPaymentMap.set(customerId, {
            name: customerName,
            totalSpent: 0,
            paymentCount: 0
          });
        }
        
        const customerData = customerPaymentMap.get(customerId);
        customerData.totalSpent += payment.amount || 0;
        customerData.paymentCount += 1;
      });

      console.log(`✅ Customer Payment Summary:`);
      customerPaymentMap.forEach((data, customerId) => {
        console.log(`   - ${data.name}: $${data.totalSpent} (${data.paymentCount} payments)`);
      });
    }

    console.log('\n✅ Customer financial data test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCustomerData(); 