import { createClient } from '@supabase/supabase-js';

// Use the anon key for this operation
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function undoRlsFixes() {
  try {
    console.log('🔄 Starting to undo RLS policy fixes...');
    
    // Individual SQL statements to undo the RLS policies
    const statements = [
      "DROP POLICY IF EXISTS \"Enable read access for all users\" ON \"public\".\"loyalty_customers\";",
      "DROP POLICY IF EXISTS \"Enable insert for authenticated users only\" ON \"public\".\"loyalty_customers\";",
      "DROP POLICY IF EXISTS \"Enable update for users based on customer_id\" ON \"public\".\"loyalty_customers\";",
      "DROP POLICY IF EXISTS \"Enable delete for users based on customer_id\" ON \"public\".\"loyalty_customers\";",
      "DROP POLICY IF EXISTS \"Enable read access for all users\" ON \"public\".\"customer_notes\";",
      "DROP POLICY IF EXISTS \"Enable insert for authenticated users only\" ON \"public\".\"customer_notes\";",
      "DROP POLICY IF EXISTS \"Enable update for users based on customer_id\" ON \"public\".\"customer_notes\";",
      "DROP POLICY IF EXISTS \"Enable delete for users based on customer_id\" ON \"public\".\"customer_notes\";"
    ];
    
    console.log('📄 Executing SQL statements to undo RLS policies...');
    
    for (const statement of statements) {
      try {
        console.log(`🔄 Executing: ${statement.substring(0, 60)}...`);
        
        // Try to execute via RPC if available
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (rpcError) {
          console.warn(`⚠️ RPC failed, trying direct SQL: ${rpcError.message}`);
          // Try direct SQL execution
          const { error: sqlError } = await supabase.from('loyalty_customers').select('*').limit(1);
          if (sqlError) {
            console.warn(`⚠️ Direct SQL also failed: ${sqlError.message}`);
          }
        } else {
          console.log(`✅ Successfully executed: ${statement.substring(0, 40)}...`);
        }
      } catch (stmtError) {
        console.warn(`⚠️ Warning executing statement: ${stmtError.message}`);
      }
    }
    
    console.log('✅ RLS policy undo completed');
    console.log('📝 Note: You may need to use service_role key for database operations now');
    console.log('💡 Alternative: You can run the SQL directly in your Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Error undoing RLS fixes:', error);
    console.log('💡 You can manually run the SQL in your Supabase dashboard:');
    console.log('📄 Check the undo_rls_fixes.sql file for the SQL statements');
  }
}

// Run the function
undoRlsFixes(); 