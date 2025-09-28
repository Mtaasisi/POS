import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔧 Running customer_payments table migration...');
    
    // Read the SQL file
    const sqlContent = readFileSync('./fix-customer-payments-table.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          console.error('Statement:', statement);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Migration completed!');
    
    // Test the table
    console.log('🧪 Testing table access...');
    const { data, error } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error testing table:', error);
    } else {
      console.log('✅ Table is accessible');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

runMigration();
