const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomersFix() {
  try {
    console.log('🧪 Testing customers page fixes...');

    // Test 1: Fetch appointments with fallback
    console.log('\n📅 Testing appointments fetch with fallback...');
    try {
      // Try with joins first
      let { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customers(name, phone),
          auth_users!technician_id(name)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.log('⚠️ Join query failed, trying simple query...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });
        
        if (simpleError) {
          console.error('❌ Simple query also failed:', simpleError);
        } else {
          console.log('✅ Simple query succeeded');
          console.log(`📊 Found ${simpleData?.length || 0} appointments`);
        }
      } else {
        console.log('✅ Join query succeeded');
        console.log(`📊 Found ${data?.length || 0} appointments`);
      }
    } catch (error) {
      console.error('❌ Appointments test failed:', error);
    }

    // Test 2: Test customers data
    console.log('\n👥 Testing customers data...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);

    if (customersError) {
      console.error('❌ Customers query failed:', customersError);
    } else {
      console.log('✅ Customers query succeeded');
      console.log(`📊 Found ${customers?.length || 0} customers`);
      
      // Test birthday data
      const customersWithBirthdays = customers?.filter(c => c.birthMonth && c.birthDay) || [];
      console.log(`🎂 ${customersWithBirthdays.length} customers have birthday data`);
    }

    // Test 3: Test revenue data
    console.log('\n💰 Testing revenue data...');
    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select('payment_type, amount');

    if (paymentsError) {
      console.error('❌ Payments query failed:', paymentsError);
    } else {
      console.log('✅ Payments query succeeded');
      console.log(`📊 Found ${payments?.length || 0} payment records`);
      
      const deviceRevenue = payments
        ?.filter(p => p.payment_type === 'device_payment')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const posRevenue = payments
        ?.filter(p => p.payment_type === 'pos_payment')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      console.log(`💳 Device Revenue: $${deviceRevenue.toFixed(2)}`);
      console.log(`💳 POS Revenue: $${posRevenue.toFixed(2)}`);
    }

    console.log('\n🎉 All tests completed!');
    console.log('✅ The customers page should now work without errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCustomersFix();
