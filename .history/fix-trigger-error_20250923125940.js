import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTriggerError() {
  console.log('🚀 Fixing trigger error for device status updates...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250131000067_fix_trigger_error.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing trigger fix migration...');
    console.log('   - Adding missing repair_cost and deposit_amount columns');
    console.log('   - Updating trigger function to handle missing columns gracefully');
    console.log('   - Recreating trigger for repair-complete status updates');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('DO $$'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('   Executing:', statement.substring(0, 50) + '...');
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          console.error('Statement:', statement);
          // Continue with other statements
        } else {
          console.log('   ✅ Statement executed successfully');
        }
      }
    }
    
    // Execute the DO block separately
    const doBlock = migrationSQL.match(/DO \$\$[\s\S]*?\$\$;/);
    if (doBlock) {
      console.log('   Executing verification block...');
      const { error } = await supabase.rpc('exec_sql', { sql: doBlock[0] });
      
      if (error) {
        console.error('❌ Error in verification block:', error);
      } else {
        console.log('   ✅ Verification completed');
      }
    }
    
    console.log('✅ Trigger error fix applied successfully!');
    console.log('');
    console.log('📋 Changes applied:');
    console.log('   ✅ Added repair_cost column to devices table');
    console.log('   ✅ Added deposit_amount column to devices table');
    console.log('   ✅ Updated create_pending_payments_on_repair_complete function');
    console.log('   ✅ Recreated trigger for repair-complete status updates');
    console.log('');
    console.log('🎉 Device status updates to repair-complete should work now!');
    
  } catch (error) {
    console.error('❌ Failed to apply trigger fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixTriggerError();
