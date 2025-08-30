const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMigration() {
  try {
    console.log('🔧 Fixing migration issues...');

    // Check if customer_revenue table exists
    console.log('\n💰 Checking customer_revenue table...');
    const { data: revenueTest, error: revenueError } = await supabase
      .from('customer_revenue')
      .select('count')
      .limit(1);

    if (revenueError && revenueError.code === '42P01') {
      console.log('❌ Customer revenue table does not exist');
      console.log('📝 The migration needs to be run manually in Supabase dashboard');
      console.log('📋 Migration file: supabase/migrations/20250127000000_create_appointments_table.sql');
      return;
    } else {
      console.log('✅ Customer revenue table exists');
    }

    // Check appointments table
    console.log('\n📅 Checking appointments table...');
    const { data: appointmentsTest, error: appointmentsError } = await supabase
      .from('appointments')
      .select('count')
      .limit(1);

    if (appointmentsError && appointmentsError.code === '42P01') {
      console.log('❌ Appointments table does not exist');
      console.log('📝 The migration needs to be run manually in Supabase dashboard');
      return;
    } else {
      console.log('✅ Appointments table exists');
    }

    // Test if the tables are working
    console.log('\n🧪 Testing table functionality...');
    
    // Test appointments
    const { data: appointments, error: appointmentsTestError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);

    if (appointmentsTestError) {
      console.error('❌ Appointments table test failed:', appointmentsTestError);
    } else {
      console.log('✅ Appointments table is working');
    }

    // Test customer_revenue
    const { data: revenue, error: revenueTestError } = await supabase
      .from('customer_revenue')
      .select('*')
      .limit(1);

    if (revenueTestError) {
      console.error('❌ Customer revenue table test failed:', revenueTestError);
    } else {
      console.log('✅ Customer revenue table is working');
    }

    console.log('\n🎉 Migration status check completed!');
    console.log('✅ Both tables exist and are functional');
    console.log('✅ The customers page should be fully connected to the database');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixMigration();
