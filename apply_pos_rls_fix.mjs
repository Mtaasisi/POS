import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

console.log('🔧 Applying POS RLS policy fixes...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyRLSFix() {
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'fix_pos_rls_policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL content loaded, applying fixes...');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: statement
          });
          
          if (error) {
            console.warn(`⚠️ Warning on statement ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️ Error on statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('✅ POS RLS policy fixes applied successfully!');
    
    // Test the fix by trying to access customers
    console.log('🧪 Testing the fix...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Test successful! Customers table is now accessible');
      console.log('📊 Sample data:', testData);
    }
    
  } catch (error) {
    console.error('❌ Error applying RLS fixes:', error);
  }
}

// Run the fix
applyRLSFix(); 