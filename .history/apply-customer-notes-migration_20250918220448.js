const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCustomerNotesTable() {
  console.log('🔄 Creating customer_notes table...');
  
  try {
    // Create customer_notes table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create customer_notes table
        CREATE TABLE IF NOT EXISTS customer_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.error('❌ Error creating table:', createError);
      return false;
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
        CREATE INDEX IF NOT EXISTS idx_customer_notes_created_by ON customer_notes(created_by);
        CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);
      `
    });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      return false;
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return false;
    }

    // Create RLS policies
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create RLS policies
        CREATE POLICY "Enable read access for all users" ON customer_notes FOR SELECT USING (true);
        CREATE POLICY "Enable insert access for all users" ON customer_notes FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update access for all users" ON customer_notes FOR UPDATE USING (true);
        CREATE POLICY "Enable delete access for all users" ON customer_notes FOR DELETE USING (true);
      `
    });

    if (policyError) {
      console.error('❌ Error creating policies:', policyError);
      return false;
    }

    // Grant permissions
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Grant permissions
        GRANT ALL ON customer_notes TO authenticated;
      `
    });

    if (grantError) {
      console.error('❌ Error granting permissions:', grantError);
      return false;
    }

    console.log('✅ Customer notes table created successfully');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting customer_notes table creation...');
  
  const success = await createCustomerNotesTable();
  
  if (success) {
    console.log('🎉 Migration completed successfully!');
  } else {
    console.log('💥 Migration failed!');
    process.exit(1);
  }
}

main().catch(console.error);
