// Apply audit table fix directly to Supabase
// This script will fix the purchase_order_audit table schema to match the process_purchase_order_payment function

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyAuditTableFix() {
  try {
    console.log('🔧 Applying audit table schema fix...');
    
    // SQL to fix the audit table schema
    const fixAuditTableSQL = `
      -- Drop existing audit table and recreate with correct schema
      DROP TABLE IF EXISTS purchase_order_audit CASCADE;

      -- Create audit table with correct schema matching the function
      CREATE TABLE purchase_order_audit (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
          action VARCHAR(100) NOT NULL,
          details JSONB,
          user_id UUID REFERENCES auth.users(id),
          created_by UUID REFERENCES auth.users(id),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);

      -- Enable RLS on audit table
      ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

      -- Create RLS policy for audit table
      CREATE POLICY "Users can view audit records for their purchase orders" ON purchase_order_audit
          FOR SELECT USING (
              EXISTS (
                  SELECT 1 FROM lats_purchase_orders 
                  WHERE id = purchase_order_id 
                  AND created_by = auth.uid()
              )
          );

      -- Create policy for inserting audit records
      CREATE POLICY "Users can create audit records for their purchase orders" ON purchase_order_audit
          FOR INSERT WITH CHECK (
              EXISTS (
                  SELECT 1 FROM lats_purchase_orders 
                  WHERE id = purchase_order_id 
                  AND created_by = auth.uid()
              )
          );
    `;

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: fixAuditTableSQL });
    
    if (error) {
      console.error('❌ Error applying audit table fix:', error);
      return false;
    }

    console.log('✅ Audit table schema fix applied successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the fix
applyAuditTableFix().then(success => {
  if (success) {
    console.log('🎉 Purchase order payment RPC function should now work correctly!');
  } else {
    console.log('💥 Failed to apply the fix. Please check the error messages above.');
  }
});
