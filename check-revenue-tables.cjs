const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRevenueTables() {
  try {
    console.log('🔍 Checking revenue-related tables...');

    // Check common revenue table names
    const revenueTableNames = [
      'customer_revenue',
      'customer_payments',
      'payments',
      'sales',
      'transactions',
      'revenue',
      'customer_transactions',
      'pos_sales',
      'device_payments',
      'repair_payments'
    ];

    for (const tableName of revenueTableNames) {
      console.log(`\n💰 Checking ${tableName} table...`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table ${tableName} does not exist`);
        } else {
          console.log(`⚠️  Table ${tableName} exists but has error:`, error.message);
        }
      } else {
        console.log(`✅ Table ${tableName} exists`);
        if (data && data.length > 0) {
          console.log(`📊 Structure:`, Object.keys(data[0]));
        }
      }
    }

    // Check if there are any payment-related fields in customers table
    console.log('\n👥 Checking customers table for payment fields...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('total_spent, total_purchases, last_purchase_date')
      .limit(3);

    if (customersError) {
      console.error('❌ Error checking customers:', customersError);
    } else {
      console.log('✅ Customers table has payment fields:');
      if (customers && customers.length > 0) {
        console.log('📊 Sample customer payment data:', customers[0]);
      }
    }

    // Check for any existing payment tables
    console.log('\n🔍 Checking for any payment-related tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%payment%');

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('✅ Payment-related tables found:');
      if (tables && tables.length > 0) {
        tables.forEach(table => console.log(`   - ${table.table_name}`));
      } else {
        console.log('   No payment-related tables found');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRevenueTables();
