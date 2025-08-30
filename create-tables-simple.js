const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('🚀 Creating missing tables...');

    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Cannot connect to database:', testError);
      return;
    }

    console.log('✅ Database connection successful');

    // Try to create appointments table using direct SQL
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .select('count')
      .limit(1);

    if (appointmentsError && appointmentsError.code === 'PGRST116') {
      console.log('📅 Appointments table does not exist, creating...');
      
      // Since we can't create tables directly, let's just test the API functions
      console.log('⚠️  Cannot create tables via client. Please run the migration manually.');
      console.log('📋 Migration file: supabase/migrations/20250127000000_create_appointments_table.sql');
    } else {
      console.log('✅ Appointments table already exists');
    }

    // Test customer revenue table
    const { error: revenueError } = await supabase
      .from('customer_revenue')
      .select('count')
      .limit(1);

    if (revenueError && revenueError.code === 'PGRST116') {
      console.log('💰 Customer revenue table does not exist');
    } else {
      console.log('✅ Customer revenue table already exists');
    }

    console.log('📝 To complete the setup, please:');
    console.log('1. Run the migration file manually in your Supabase dashboard');
    console.log('2. Or use the Supabase CLI: npx supabase db push');
    console.log('3. The migration file is located at: supabase/migrations/20250127000000_create_appointments_table.sql');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTables();
