const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');

    // Check appointments table
    console.log('\n📅 Checking appointments table...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);

    if (appointmentsError) {
      console.error('❌ Appointments table error:', appointmentsError);
    } else {
      console.log('✅ Appointments table exists');
      if (appointments && appointments.length > 0) {
        console.log('📋 Sample appointment structure:', Object.keys(appointments[0]));
      }
    }

    // Check customer_revenue table
    console.log('\n💰 Checking customer_revenue table...');
    const { data: revenue, error: revenueError } = await supabase
      .from('customer_revenue')
      .select('*')
      .limit(1);

    if (revenueError) {
      console.error('❌ Customer revenue table error:', revenueError);
    } else {
      console.log('✅ Customer revenue table exists');
      if (revenue && revenue.length > 0) {
        console.log('📊 Sample revenue structure:', Object.keys(revenue[0]));
      }
    }

    // Check customers table
    console.log('\n👥 Checking customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (customersError) {
      console.error('❌ Customers table error:', customersError);
    } else {
      console.log('✅ Customers table exists');
      if (customers && customers.length > 0) {
        console.log('👤 Sample customer structure:', Object.keys(customers[0]));
      }
    }

    // Check auth_users table
    console.log('\n🔐 Checking auth_users table...');
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth_users')
      .select('*')
      .limit(1);

    if (authUsersError) {
      console.error('❌ Auth users table error:', authUsersError);
    } else {
      console.log('✅ Auth users table exists');
      if (authUsers && authUsers.length > 0) {
        console.log('🔑 Sample auth user structure:', Object.keys(authUsers[0]));
      }
    }

    // Test simple appointments query
    console.log('\n🧪 Testing simple appointments query...');
    const { data: simpleAppointments, error: simpleError } = await supabase
      .from('appointments')
      .select('id, customer_id, service_type, appointment_date, status')
      .limit(3);

    if (simpleError) {
      console.error('❌ Simple appointments query error:', simpleError);
    } else {
      console.log(`✅ Simple appointments query successful: ${simpleAppointments?.length || 0} records`);
      if (simpleAppointments && simpleAppointments.length > 0) {
        console.log('📋 Sample data:', simpleAppointments[0]);
      }
    }

    // Test simple revenue query
    console.log('\n🧪 Testing simple revenue query...');
    const { data: simpleRevenue, error: simpleRevenueError } = await supabase
      .from('customer_revenue')
      .select('id, customer_id, revenue_type, amount')
      .limit(3);

    if (simpleRevenueError) {
      console.error('❌ Simple revenue query error:', simpleRevenueError);
    } else {
      console.log(`✅ Simple revenue query successful: ${simpleRevenue?.length || 0} records`);
      if (simpleRevenue && simpleRevenue.length > 0) {
        console.log('📊 Sample data:', simpleRevenue[0]);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTables();
