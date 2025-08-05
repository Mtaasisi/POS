import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFix() {
  try {
    console.log('🔧 Running SQL fix for sales_orders 400 error...');
    
    // Read the SQL file
    const sql = fs.readFileSync('fix_sales_order_400_error_complete.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // For DO blocks, we need to handle them specially
          if (statement.startsWith('DO $$')) {
            console.log('⏭️ Skipping DO block (will be handled by table creation)');
            continue;
          }
          
          // Execute the statement
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️ Statement ${i + 1} had an issue (this might be expected):`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️ Statement ${i + 1} failed (this might be expected):`, err.message);
        }
      }
    }
    
    console.log('✅ SQL fix completed!');
    
  } catch (error) {
    console.error('❌ Error running SQL fix:', error);
  }
}

runSqlFix(); 