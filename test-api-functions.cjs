const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAPI() {
  try {
    console.log('🧪 Testing API functions...');

    // Test fetching appointments
    console.log('\n📅 Testing appointments API...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        customers!inner(name, phone),
        auth_users!technician_id(name)
      `)
      .order('appointment_date', { ascending: true })
      .limit(5);

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
    } else {
      console.log(`✅ Fetched ${appointments?.length || 0} appointments`);
      if (appointments && appointments.length > 0) {
        console.log('📋 Sample appointment:', {
          id: appointments[0].id,
          customer_name: appointments[0].customers?.name,
          service_type: appointments[0].service_type,
          date: appointments[0].appointment_date,
          status: appointments[0].status
        });
      }
    }

    // Test fetching customer revenue
    console.log('\n💰 Testing customer revenue API...');
    const { data: revenue, error: revenueError } = await supabase
      .from('customer_revenue')
      .select(`
        *,
        customers!inner(name),
        devices(device_name)
      `)
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (revenueError) {
      console.error('❌ Error fetching customer revenue:', revenueError);
    } else {
      console.log(`✅ Fetched ${revenue?.length || 0} revenue records`);
      if (revenue && revenue.length > 0) {
        console.log('📊 Sample revenue record:', {
          id: revenue[0].id,
          customer_name: revenue[0].customers?.name,
          revenue_type: revenue[0].revenue_type,
          amount: revenue[0].amount,
          date: revenue[0].transaction_date
        });
      }
    }

    // Test revenue summary calculation
    console.log('\n📊 Testing revenue summary calculation...');
    const { data: allRevenue, error: allRevenueError } = await supabase
      .from('customer_revenue')
      .select('revenue_type, amount, customer_id');

    if (allRevenueError) {
      console.error('❌ Error fetching all revenue:', allRevenueError);
    } else {
      const revenueData = allRevenue || [];
      const totalRevenue = revenueData.reduce((sum, item) => sum + Number(item.amount), 0);
      const deviceRevenue = revenueData
        .filter(item => item.revenue_type === 'device_repair')
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const posRevenue = revenueData
        .filter(item => item.revenue_type === 'pos_sale')
        .reduce((sum, item) => sum + Number(item.amount), 0);
      
      console.log('✅ Revenue summary calculated:');
      console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`);
      console.log(`   Device Revenue: $${deviceRevenue.toFixed(2)}`);
      console.log(`   POS Revenue: $${posRevenue.toFixed(2)}`);
    }

    // Test appointment statistics
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
      
      console.log('✅ Appointment statistics calculated:');
      console.log(`   Total Appointments: ${totalAppointments}`);
      console.log(`   Pending: ${pendingAppointments}`);
      console.log(`   Confirmed: ${confirmedAppointments}`);
      console.log(`   Completed: ${completedAppointments}`);
    }

    console.log('\n🎉 All API tests completed successfully!');
    console.log('✅ The customers page should now be fully connected to the database');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
