const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyAuditTableFix() {
  try {
    console.log('🔧 Applying comprehensive audit table fix...');
    
    // Step 1: Drop existing audit table
    console.log('🗑️ Dropping existing audit table...');
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS purchase_order_audit CASCADE;' 
    });
    
    if (dropError) {
      console.log('⚠️ Drop table error (expected if table doesn\'t exist):', dropError.message);
    }
    
    // Step 2: Create new audit table
    console.log('🏗️ Creating new audit table...');
    const createTableSQL = `
      CREATE TABLE purchase_order_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        user_id UUID REFERENCES auth.users(id),
        created_by UUID REFERENCES auth.users(id),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('❌ Error creating table:', createError);
      return false;
    }
    
    console.log('✅ Audit table created successfully!');
    
    // Step 3: Create indexes
    console.log('📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);',
      'CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);',
      'CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_action ON purchase_order_audit(action);',
      'CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_user_id ON purchase_order_audit(user_id);'
    ];
    
    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (indexError) {
        console.log('⚠️ Index creation warning:', indexError.message);
      }
    }
    
    // Step 4: Enable RLS
    console.log('🔒 Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;' 
    });
    
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return false;
    }
    
    // Step 5: Create RLS policies
    console.log('🛡️ Creating RLS policies...');
    const policies = [
      `CREATE POLICY "audit_select_policy" ON purchase_order_audit
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
          )
        );`,
      `CREATE POLICY "audit_insert_policy" ON purchase_order_audit
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
          )
        );`,
      `CREATE POLICY "audit_update_policy" ON purchase_order_audit
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
          )
        );`,
      `CREATE POLICY "audit_delete_policy" ON purchase_order_audit
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
          )
        );`
    ];
    
    for (const policySQL of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL });
      if (policyError) {
        console.log('⚠️ Policy creation warning:', policyError.message);
      }
    }
    
    // Step 6: Grant permissions
    console.log('🔑 Granting permissions...');
    const { error: grantError } = await supabase.rpc('exec_sql', { 
      sql: 'GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_audit TO authenticated;' 
    });
    
    if (grantError) {
      console.log('⚠️ Grant permissions warning:', grantError.message);
    }
    
    console.log('✅ Audit table fix applied successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error applying audit table fix:', error);
    return false;
  }
}

applyAuditTableFix().then(success => {
  if (success) {
    console.log('🎉 Audit table fix completed successfully!');
  } else {
    console.log('💥 Audit table fix failed!');
  }
  process.exit(success ? 0 : 1);
});