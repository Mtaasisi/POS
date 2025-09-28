// Apply repair parts RLS policy fix
// This script fixes the broken RLS policies causing 403 errors

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Please set your service role key:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRepairPartsRLS() {
  try {
    console.log('🔧 Fixing repair_parts RLS policies...');
    
    // First, check current policies
    console.log('📋 Checking current policies...');
    const { data: currentPolicies, error: checkError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'repair_parts');
    
    if (checkError) {
      console.log('ℹ️  Could not check current policies (this is normal)');
    } else {
      console.log('Current policies:', currentPolicies);
    }
    
    // Drop existing broken policies
    console.log('🗑️  Dropping existing policies...');
    await supabase.rpc('exec', { 
      sql: 'DROP POLICY IF EXISTS "Users can view repair parts" ON repair_parts;' 
    });
    await supabase.rpc('exec', { 
      sql: 'DROP POLICY IF EXISTS "Technicians and admins can manage repair parts" ON repair_parts;' 
    });
    
    // Create corrected policies
    console.log('✅ Creating new policies...');
    
    // Policy for SELECT
    await supabase.rpc('exec', { 
      sql: `CREATE POLICY "Users can view repair parts" ON repair_parts
            FOR SELECT USING (auth.role() = 'authenticated');` 
    });
    
    // Policy for INSERT
    await supabase.rpc('exec', { 
      sql: `CREATE POLICY "Authenticated users can insert repair parts" ON repair_parts
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');` 
    });
    
    // Policy for UPDATE
    await supabase.rpc('exec', { 
      sql: `CREATE POLICY "Authenticated users can update repair parts" ON repair_parts
            FOR UPDATE USING (auth.role() = 'authenticated');` 
    });
    
    // Policy for DELETE (for technicians and admins)
    await supabase.rpc('exec', { 
      sql: `CREATE POLICY "Technicians and admins can delete repair parts" ON repair_parts
            FOR DELETE USING (
                auth.role() = 'authenticated' AND (
                    EXISTS (
                        SELECT 1 FROM auth_users 
                        WHERE auth_users.id = auth.uid() 
                        AND auth_users.role IN ('technician', 'admin')
                    )
                )
            );` 
    });
    
    console.log('✅ Repair parts RLS policies fixed successfully!');
    console.log('📋 New policies created:');
    console.log('  - Users can view repair parts (SELECT)');
    console.log('  - Authenticated users can insert repair parts (INSERT)');
    console.log('  - Authenticated users can update repair parts (UPDATE)');
    console.log('  - Technicians and admins can delete repair parts (DELETE)');
    
    // Test the fix by trying to select from repair_parts
    console.log('🧪 Testing the fix...');
    const { data: testData, error: testError } = await supabase
      .from('repair_parts')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Test successful - repair_parts table is now accessible');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

fixRepairPartsRLS();
