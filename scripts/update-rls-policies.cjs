// Update RLS Policies for Store Locations
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - using service role key for admin operations
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImF1ZCI6Imh0dHBzOi8vanhoenZlYm9yZXpqanNtenNnYmMuc3VwYWJhc2UuY28iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRLSPolicies() {
  try {
    console.log('🔧 Updating RLS Policies for Store Locations...\n');
    
    // Drop existing policies
    console.log('1. 🗑️ Dropping existing policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Allow authenticated users to view store locations" ON lats_store_locations;',
      'DROP POLICY IF EXISTS "Allow authenticated users to insert store locations" ON lats_store_locations;',
      'DROP POLICY IF EXISTS "Allow authenticated users to update store locations" ON lats_store_locations;',
      'DROP POLICY IF EXISTS "Allow authenticated users to delete store locations" ON lats_store_locations;'
    ];
    
    for (const policy of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.log('⚠️ Could not drop policy (might not exist):', error.message);
      }
    }
    
    // Create new policies
    console.log('\n2. ✅ Creating new policies...');
    const newPolicies = [
      `CREATE POLICY "Enable read access for all users" ON lats_store_locations
       FOR SELECT USING (true);`,
      
      `CREATE POLICY "Enable insert for authenticated users only" ON lats_store_locations
       FOR INSERT WITH CHECK (auth.role() = 'authenticated');`,
      
      `CREATE POLICY "Enable update for authenticated users only" ON lats_store_locations
       FOR UPDATE USING (auth.role() = 'authenticated');`,
      
      `CREATE POLICY "Enable delete for authenticated users only" ON lats_store_locations
       FOR DELETE USING (auth.role() = 'authenticated');`
    ];
    
    for (const policy of newPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.log('❌ Error creating policy:', error.message);
      } else {
        console.log('✅ Policy created successfully');
      }
    }
    
    console.log('\n🎉 RLS policies updated successfully!');
    console.log('📍 Now you can access the store locations page at: /store-locations');
    
  } catch (error) {
    console.error('❌ Failed to update RLS policies:', error);
  }
}

// Run the script
updateRLSPolicies();
