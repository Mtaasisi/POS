import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRpcFix() {
  try {
    console.log('🔧 Applying RPC function fix...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250131000058_fix_rpc_audit_schema_mismatch.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded, executing SQL...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });
    
    if (error) {
      console.error('❌ Error executing migration:', error);
      
      // Try direct SQL execution as fallback
      console.log('🔄 Trying direct SQL execution...');
      const { error: directError } = await supabase
        .from('_sql')
        .select('*')
        .limit(0);
        
      if (directError) {
        console.log('📝 Note: Direct SQL execution not available, please run the migration manually:');
        console.log('   Migration file: supabase/migrations/20250131000058_fix_rpc_audit_schema_mismatch.sql');
        return;
      }
      
      // If we can execute direct SQL, try that
      const { error: sqlError } = await supabase
        .rpc('exec', { query: migrationSql });
        
      if (sqlError) {
        console.error('❌ Direct SQL execution also failed:', sqlError);
        console.log('📝 Please run the migration manually using the Supabase dashboard or CLI');
        return;
      }
    }
    
    console.log('✅ RPC function fix applied successfully!');
    console.log('🎯 The process_purchase_order_payment function has been updated');
    console.log('💡 You can now test the payment functionality again');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('📝 Please run the migration manually:');
    console.log('   Migration file: supabase/migrations/20250131000058_fix_rpc_audit_schema_mismatch.sql');
  }
}

// Run the fix
applyRpcFix();
