const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use the credentials from the scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPaymentProvidersMigration() {
  try {
    console.log('🚀 Starting payment_providers migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250128000000_create_payment_providers_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file read successfully');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute the migration SQL directly
    console.log('⚡ Executing migration SQL...');
    
    try {
      // Use the REST API to execute raw SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ sql: migrationSQL })
      });
      
      if (!response.ok) {
        // If exec_sql doesn't exist, try a different approach
        console.log('⚠️ exec_sql RPC not available, trying alternative approach...');
        
        // Try to create the table using a simple insert to test if it exists
        const { error: testError } = await supabase
          .from('payment_providers')
          .select('id')
          .limit(1);
        
        if (testError && testError.message.includes('does not exist')) {
          console.log('📋 Table does not exist, manual creation required');
          console.log('🔧 Please run the migration manually in your Supabase dashboard');
          console.log('📄 Migration file location:', migrationPath);
          return;
        }
      } else {
        console.log('✅ Migration executed successfully via RPC');
      }
    } catch (err) {
      console.error('❌ Migration execution failed:', err.message);
      console.log('🔧 Please run the migration manually in your Supabase dashboard');
      console.log('📄 Migration file location:', migrationPath);
    }
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const { data, error } = await supabase
      .from('payment_providers')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Table verification failed:', error.message);
    } else {
      console.log('✅ payment_providers table created successfully!');
      console.log('📊 Sample data:', data);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
applyPaymentProvidersMigration();
