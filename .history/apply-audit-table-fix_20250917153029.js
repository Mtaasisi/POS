const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAuditFix() {
  try {
    console.log('🔧 Applying audit table INSERT policy fix...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix-audit-table-insert-policy.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          console.error('Statement:', statement);
          return false;
        }
      }
    }
    
    console.log('✅ Audit table INSERT policy fix applied successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error applying audit fix:', error);
    return false;
  }
}

applyAuditFix().then(success => {
  if (success) {
    console.log('🎉 Audit table fix completed successfully');
  } else {
    console.log('💥 Audit table fix failed');
    process.exit(1);
  }
});
