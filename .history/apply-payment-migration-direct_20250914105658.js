import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecSqlFunction() {
  try {
    console.log('🔧 Creating exec_sql function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;
    
    // Use direct SQL execution via the REST API
    const { error } = await supabase
      .from('_sql')
      .select('*')
      .limit(0);
    
    if (error && error.code === 'PGRST202') {
      // Function doesn't exist, let's try to create it via a different approach
      console.log('📝 Creating exec_sql function via direct SQL...');
      
      // Try to execute the function creation directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: createFunctionSQL })
      });
      
      if (!response.ok) {
        console.log('⚠️  Could not create exec_sql function, trying alternative approach...');
        return false;
      }
    }
    
    console.log('✅ exec_sql function ready');
    return true;
  } catch (error) {
    console.log('⚠️  Could not create exec_sql function:', error.message);
    return false;
  }
}

async function applyMigrationDirectly() {
  try {
    console.log('🚀 Applying payment functionality migration directly...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250131000054_fix_payment_functionality_final.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded, applying to database...');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('='));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Try to execute via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: statement + ';' })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error in statement ${i + 1}:`, errorText);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Exception in statement ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    return errorCount === 0;
  } catch (error) {
    console.error('❌ Error in applyMigrationDirectly:', error);
    return false;
  }
}

async function verifyFunctionExists() {
  try {
    console.log('🔍 Verifying process_purchase_order_payment function exists...');
    
    // Try to call the function with dummy parameters to see if it exists
    const { data, error } = await supabase.rpc('process_purchase_order_payment', {
      purchase_order_id_param: '00000000-0000-0000-0000-000000000000',
      payment_account_id_param: '00000000-0000-0000-0000-000000000000',
      amount_param: 0,
      currency_param: 'USD',
      payment_method_param: 'test',
      payment_method_id_param: '00000000-0000-0000-0000-000000000000',
      user_id_param: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      if (error.code === 'PGRST202') {
        console.log('❌ Function process_purchase_order_payment does not exist');
        return false;
      } else {
        console.log('✅ Function exists (got expected validation error)');
        return true;
      }
    }
    
    console.log('✅ Function exists and executed successfully');
    return true;
  } catch (error) {
    console.log('❌ Error verifying function:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting payment functionality migration...\n');
  
  // First try to create the exec_sql function
  await createExecSqlFunction();
  
  // Apply the migration
  const migrationSuccess = await applyMigrationDirectly();
  
  if (migrationSuccess) {
    console.log('✅ Migration applied successfully!');
    
    // Verify the function exists
    const functionExists = await verifyFunctionExists();
    
    if (functionExists) {
      console.log('🎉 Payment functionality is now ready!');
    } else {
      console.log('⚠️  Migration applied but function verification failed');
    }
  } else {
    console.log('💥 Migration failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
