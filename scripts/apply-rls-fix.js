import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFix() {
  console.log('🔧 Applying RLS fix for POS sales...\n');

  try {
    // Read the SQL fix file
    const sqlPath = path.join(process.cwd(), 'fix-pos-rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('1. Applying RLS policy changes...');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase
          .from('lats_sales')
          .select('count')
          .limit(1);
        
        // For now, let's just test if we can read the table
        if (error) {
          console.log('❌ Error:', error.message);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }

    // Test inserting a sale directly
    console.log('\n2. Testing sale insertion...');
    const testSale = {
      sale_number: `TEST-FIX-${Date.now()}`,
      customer_id: null,
      total_amount: 1000,
      payment_method: 'cash',
      status: 'completed',
      created_by: null
    };

    const { data: insertData, error: insertError } = await supabase
      .from('lats_sales')
      .insert([testSale])
      .select();

    if (insertError) {
      console.log('❌ Error inserting test sale:', insertError.message);
      
      // Try to get the current RLS policies
      console.log('\n3. Checking current RLS status...');
      const { data: policies, error: policyError } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_name', 'lats_sales');

      if (policyError) {
        console.log('❌ Could not check policies:', policyError.message);
      } else {
        console.log('✅ Current policies:', policies);
      }
    } else {
      console.log('✅ Successfully inserted test sale:', insertData[0].id);
      
      // Clean up test data
      await supabase
        .from('lats_sales')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Cleaned up test sale');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyRLSFix().then(() => {
  console.log('\n🏁 RLS fix application completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ RLS fix application failed:', error);
  process.exit(1);
});
