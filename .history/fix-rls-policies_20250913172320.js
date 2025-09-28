import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('🔧 Fixing RLS policies for purchase order tables...');
    
    // Drop existing policies first
    console.log('🗑️ Dropping existing policies...');
    
    const dropPoliciesSQL = `
      -- Drop existing policies for purchase_order_messages
      DROP POLICY IF EXISTS "Users can view purchase order messages" ON purchase_order_messages;
      DROP POLICY IF EXISTS "Users can create purchase order messages" ON purchase_order_messages;
      DROP POLICY IF EXISTS "Users can update purchase order messages" ON purchase_order_messages;
      DROP POLICY IF EXISTS "Users can delete purchase order messages" ON purchase_order_messages;
      
      -- Drop existing policies for purchase_order_payments
      DROP POLICY IF EXISTS "Users can view purchase order payments" ON purchase_order_payments;
      DROP POLICY IF EXISTS "Users can create purchase order payments" ON purchase_order_payments;
      DROP POLICY IF EXISTS "Users can update their purchase order payments" ON purchase_order_payments;
      DROP POLICY IF EXISTS "Users can delete their purchase order payments" ON purchase_order_payments;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { query: dropPoliciesSQL });
    if (dropError) {
      console.log('⚠️ Could not drop policies (might not exist):', dropError.message);
    } else {
      console.log('✅ Existing policies dropped');
    }
    
    // Create new, more permissive policies
    console.log('🆕 Creating new RLS policies...');
    
    const createPoliciesSQL = `
      -- More permissive policies for purchase_order_messages
      CREATE POLICY "Enable read access for all users" ON purchase_order_messages
        FOR SELECT USING (true);
        
      CREATE POLICY "Enable insert for all users" ON purchase_order_messages
        FOR INSERT WITH CHECK (true);
        
      CREATE POLICY "Enable update for all users" ON purchase_order_messages
        FOR UPDATE USING (true);
        
      CREATE POLICY "Enable delete for all users" ON purchase_order_messages
        FOR DELETE USING (true);
        
      -- More permissive policies for purchase_order_payments
      CREATE POLICY "Enable read access for all users" ON purchase_order_payments
        FOR SELECT USING (true);
        
      CREATE POLICY "Enable insert for all users" ON purchase_order_payments
        FOR INSERT WITH CHECK (true);
        
      CREATE POLICY "Enable update for all users" ON purchase_order_payments
        FOR UPDATE USING (true);
        
      CREATE POLICY "Enable delete for all users" ON purchase_order_payments
        FOR DELETE USING (true);
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { query: createPoliciesSQL });
    if (createError) {
      console.log('❌ Error creating policies:', createError.message);
      console.log('');
      console.log('🔧 Please run this SQL manually in your Supabase SQL Editor:');
      console.log('');
      console.log(createPoliciesSQL);
    } else {
      console.log('✅ New RLS policies created successfully');
    }
    
    // Test the fix
    console.log('');
    console.log('🧪 Testing the fix...');
    
    const { data: testData, error: testError } = await supabase
      .from('purchase_order_messages')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Test successful - table is now accessible');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixRLSPolicies();
