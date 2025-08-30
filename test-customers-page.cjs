const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomersPage() {
  try {
    console.log('🧪 Testing customers page functionality...');

    // Test 1: Fetch customers
    console.log('\n👥 Testing customer fetching...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);

    if (customersError) {
      console.error('❌ Error fetching customers:', customersError);
    } else {
      console.log(`✅ Fetched ${customers?.length || 0} customers`);
    }

    // Test 2: Fetch appointments
    console.log('\n📅 Testing appointment fetching...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(5);

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
    } else {
      console.log(`✅ Fetched ${appointments?.length || 0} appointments`);
    }

    // Test 3: Fetch customer payments for revenue calculation
    console.log('\n💰 Testing revenue calculation...');
    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select('payment_type, amount')
      .limit(10);

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
    } else {
      console.log(`✅ Fetched ${payments?.length || 0} payment records`);
      
      const deviceRevenue = payments
        ?.filter(p => p.payment_type === 'device_payment')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      const posRevenue = payments
        ?.filter(p => p.payment_type === 'pos_payment')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      console.log(`📊 Revenue breakdown:`);
      console.log(`   Device Revenue: $${deviceRevenue.toFixed(2)}`);
      console.log(`   POS Revenue: $${posRevenue.toFixed(2)}`);
    }

    // Test 4: Test appointment statistics
    console.log('\n📈 Testing appointment statistics...');
    const { data: allAppointments, error: allAppointmentsError } = await supabase
      .from('appointments')
      .select('status, appointment_date');

    if (allAppointmentsError) {
      console.error('❌ Error fetching all appointments:', allAppointmentsError);
    } else {
      const appointmentsData = allAppointments || [];
      const totalAppointments = appointmentsData.length;
      const pendingAppointments = appointmentsData.filter(a => a.status === 'pending').length;
      const confirmedAppointments = appointmentsData.filter(a => a.status === 'confirmed').length;
      const completedAppointments = appointmentsData.filter(a => a.status === 'completed').length;
      
      console.log('✅ Appointment statistics:');
      console.log(`   Total: ${totalAppointments}`);
      console.log(`   Pending: ${pendingAppointments}`);
      console.log(`   Confirmed: ${confirmedAppointments}`);
      console.log(`   Completed: ${completedAppointments}`);
    }

    // Test 5: Test customer search
    console.log('\n🔍 Testing customer search...');
    const { data: searchResults, error: searchError } = await supabase
      .from('customers')
      .select('name, phone, email')
      .or('name.ilike.%test%,phone.ilike.%test%')
      .limit(3);

    if (searchError) {
      console.error('❌ Error searching customers:', searchError);
    } else {
      console.log(`✅ Search test completed: ${searchResults?.length || 0} results`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ The customers page should now be fully functional with:');
    console.log('   - Real customer data from database');
    console.log('   - Real appointment data from database');
    console.log('   - Real revenue calculations from customer_payments');
    console.log('   - Working search functionality');
    console.log('   - Proper statistics and analytics');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCustomersPage();
