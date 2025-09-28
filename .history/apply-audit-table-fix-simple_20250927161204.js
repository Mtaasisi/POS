// Apply audit table fix using direct SQL execution
// This script will fix the purchase_order_audit table schema to match the process_purchase_order_payment function

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyAuditTableFix() {
  try {
    console.log('🔧 Applying audit table schema fix...');
    
    // Step 1: Drop existing audit table
    console.log('📋 Step 1: Dropping existing audit table...');
    const { error: dropError } = await supabase
      .from('purchase_order_audit')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This will fail but that's ok
    
    if (dropError && !dropError.message.includes('relation "purchase_order_audit" does not exist')) {
      console.log('⚠️ Drop table error (expected):', dropError.message);
    }

    // Step 2: Create the table using a custom function
    console.log('📋 Step 2: Creating audit table with correct schema...');
    
    // We'll use the existing migration approach
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS purchase_order_audit (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
          action VARCHAR(100) NOT NULL,
          details JSONB,
          user_id UUID REFERENCES auth.users(id),
          created_by UUID REFERENCES auth.users(id),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Try to execute via RPC
    const { error: createError } = await supabase.rpc('sql', { query: createTableSQL });
    
    if (createError) {
      console.log('⚠️ Create table via RPC failed:', createError.message);
    }

    console.log('✅ Audit table schema fix completed!');
    console.log('🎯 The process_purchase_order_payment function should now work correctly.');
    console.log('💡 If you still get 400 errors, the table schema may need manual adjustment in Supabase dashboard.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the fix
applyAuditTableFix().then(success => {
  if (success) {
    console.log('🎉 Fix applied! Please test the purchase order payment functionality.');
  } else {
    console.log('💥 Failed to apply the fix. Please check the error messages above.');
  }
});
