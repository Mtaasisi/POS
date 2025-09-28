// Browser console script to test customer_notes table
// Copy and paste this into your browser console while on your app

async function testCustomerNotesTable() {
  console.log('🧪 Testing customer_notes table...');
  
  try {
    // Get the supabase client from the app
    const supabase = window.supabase || window.__supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found. Make sure you are on your app page.');
      return false;
    }

    // Test if we can insert a customer note
    console.log('🔄 Testing customer note insertion...');
    
    const testNote = {
      id: '00000000-0000-0000-0000-000000000001',
      customer_id: '00000000-0000-0000-0000-000000000001', // This will fail due to foreign key, but that's expected
      content: 'Test note',
      created_by: '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString()
    };
    
    const { error: testError } = await supabase
      .from('customer_notes')
      .insert(testNote);
    
    if (testError && testError.code === 'PGRST116') {
      console.log('❌ Customer notes table does not exist (404 error)');
      console.log('💡 You need to run this SQL in the Supabase SQL editor:');
      console.log(`
-- Copy and paste this SQL into your Supabase SQL editor:

-- Create customer_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_by ON customer_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);

-- Enable RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON customer_notes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON customer_notes;
DROP POLICY IF EXISTS "Enable update access for all users" ON customer_notes;
DROP POLICY IF EXISTS "Enable delete access for all users" ON customer_notes;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON customer_notes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON customer_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON customer_notes FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON customer_notes FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON customer_notes TO authenticated;
      `);
      return false;
    } else if (testError && testError.code === '23503') {
      console.log('✅ Customer notes table exists and is working correctly (foreign key constraint working as expected)');
      return true;
    } else if (testError) {
      console.error('❌ Unexpected test error:', testError);
      console.log('Error details:', testError);
      return false;
    } else {
      console.log('✅ Customer notes table exists and test insert successful');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the function
testCustomerNotesTable().then(success => {
  if (success) {
    console.log('🎉 Customer notes table is working correctly!');
  } else {
    console.log('💥 Customer notes table needs to be created/fixed.');
  }
});
