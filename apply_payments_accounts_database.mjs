import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPaymentsAccountsDatabase() {
  console.log('🚀 Starting Payments Accounts Database Setup...\n');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'setup_payments_accounts_database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📖 Reading SQL file...');
    console.log(`📁 File: ${sqlFilePath}`);
    console.log(`📏 Size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Execution Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Total: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Payments Accounts Database setup completed successfully!');
      console.log('\n📋 What was created:');
      console.log('   • finance_accounts table');
      console.log('   • payment_methods table');
      console.log('   • payment_method_accounts table');
      console.log('   • payment_transactions table');
      console.log('   • account_balance_history table');
      console.log('   • Row Level Security policies');
      console.log('   • Sample data (accounts and payment methods)');
      console.log('   • Database functions and triggers');
      console.log('   • Performance indexes');
      
      console.log('\n🔗 You can now use the Payments Accounts feature in your POS system!');
    } else {
      console.log('\n⚠️  Some statements failed. Please check the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applyPaymentsAccountsDatabaseDirect() {
  console.log('🚀 Starting Payments Accounts Database Setup (Direct Method)...\n');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'setup_payments_accounts_database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📖 Reading SQL file...');
    console.log(`📁 File: ${sqlFilePath}`);
    console.log(`📏 Size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Execute the entire SQL script
    console.log('⏳ Executing SQL script...');
    
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL script:', error.message);
      console.log('\n💡 Try running the SQL manually in your Supabase SQL Editor:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of setup_payments_accounts_database.sql');
      console.log('4. Click "Run"');
      process.exit(1);
    } else {
      console.log('✅ SQL script executed successfully!');
      console.log('\n🎉 Payments Accounts Database setup completed!');
      console.log('\n📋 What was created:');
      console.log('   • finance_accounts table');
      console.log('   • payment_methods table');
      console.log('   • payment_method_accounts table');
      console.log('   • payment_transactions table');
      console.log('   • account_balance_history table');
      console.log('   • Row Level Security policies');
      console.log('   • Sample data (accounts and payment methods)');
      console.log('   • Database functions and triggers');
      console.log('   • Performance indexes');
      
      console.log('\n🔗 You can now use the Payments Accounts feature in your POS system!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.log('\n💡 Try running the SQL manually in your Supabase SQL Editor:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of setup_payments_accounts_database.sql');
    console.log('4. Click "Run"');
    process.exit(1);
  }
}

// Check if we should use direct method
const useDirect = process.argv.includes('--direct');

if (useDirect) {
  applyPaymentsAccountsDatabaseDirect();
} else {
  applyPaymentsAccountsDatabase();
} 