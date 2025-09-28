// Browser console script to create customer_notes table
// Run this in the browser console on your app

async function createCustomerNotesTable() {
  console.log('🔄 Creating customer_notes table...');
  
  try {
    // Get the supabase client from the app
    const supabase = window.supabase || window.__supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found');
      return false;
    }

    // Create the table using SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS customer_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });

    if (createError) {
      console.error('❌ Error creating table:', createError);
      return false;
    }

    // Create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
      CREATE INDEX IF NOT EXISTS idx_customer_notes_created_by ON customer_notes(created_by);
      CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);
    `;

    const { error: indexError } = await supabase.rpc('exec', { sql: indexSQL });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      return false;
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec', { 
      sql: 'ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;' 
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return false;
    }

    // Create RLS policies
    const policiesSQL = `
      CREATE POLICY "Enable read access for all users" ON customer_notes FOR SELECT USING (true);
      CREATE POLICY "Enable insert access for all users" ON customer_notes FOR INSERT WITH CHECK (true);
      CREATE POLICY "Enable update access for all users" ON customer_notes FOR UPDATE USING (true);
      CREATE POLICY "Enable delete access for all users" ON customer_notes FOR DELETE USING (true);
    `;

    const { error: policyError } = await supabase.rpc('exec', { sql: policiesSQL });

    if (policyError) {
      console.error('❌ Error creating policies:', policyError);
      return false;
    }

    // Grant permissions
    const { error: grantError } = await supabase.rpc('exec', { 
      sql: 'GRANT ALL ON customer_notes TO authenticated;' 
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

// Run the function
createCustomerNotesTable().then(success => {
  if (success) {
    console.log('🎉 Customer notes table creation completed successfully!');
  } else {
    console.log('💥 Customer notes table creation failed!');
  }
});
