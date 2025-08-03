import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function undoRlsFixes() {
  try {
    console.log('🔄 Starting to undo RLS policy fixes...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'undo_rls_fixes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL to undo RLS policies...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Fallback: Execute SQL statements individually
      console.log('🔄 Trying individual SQL statements...');
      
      const statements = [
        "DROP POLICY IF EXISTS \"Enable read access for all users\" ON \"public\".\"loyalty_customers\";",
        "DROP POLICY IF EXISTS \"Enable insert for authenticated users only\" ON \"public\".\"loyalty_customers\";",
        "DROP POLICY IF EXISTS \"Enable update for users based on customer_id\" ON \"public\".\"loyalty_customers\";",
        "DROP POLICY IF EXISTS \"Enable delete for users based on customer_id\" ON \"public\".\"loyalty_customers\";",
        "DROP POLICY IF EXISTS \"Enable read access for all users\" ON \"public\".\"customer_notes\";",
        "DROP POLICY IF EXISTS \"Enable insert for authenticated users only\" ON \"public\".\"customer_notes\";",
        "DROP POLICY IF EXISTS \"Enable update for users based on customer_id\" ON \"public\".\"customer_notes\";",
        "DROP POLICY IF EXISTS \"Enable delete for users based on customer_id\" ON \"public\".\"customer_notes\";",
        "REVOKE ALL ON \"public\".\"loyalty_customers\" FROM \"authenticated\";",
        "REVOKE ALL ON \"public\".\"loyalty_customers\" FROM \"service_role\";",
        "REVOKE ALL ON \"public\".\"customer_notes\" FROM \"authenticated\";",
        "REVOKE ALL ON \"public\".\"customer_notes\" FROM \"service_role\";"
      ];
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.warn(`⚠️ Warning executing statement: ${stmtError.message}`);
          } else {
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          }
        } catch (stmtError) {
          console.warn(`⚠️ Warning executing statement: ${stmtError.message}`);
        }
      }
    } else {
      console.log('✅ Successfully executed undo RLS fixes SQL');
    }
    
    console.log('✅ RLS policy undo completed');
    console.log('📝 Note: You may need to use service_role key for database operations now');
    
  } catch (error) {
    console.error('❌ Error undoing RLS fixes:', error);
    process.exit(1);
  }
}

// Run the function
undoRlsFixes(); 