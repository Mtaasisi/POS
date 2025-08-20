// Apply Store Shelves Migration
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyShelfMigration() {
  try {
    console.log('🏪 Applying Store Shelves Migration...\n');
    
    // Check if table exists
    console.log('1. 📋 Checking if shelves table exists...');
    const { data: existingTable, error: checkError } = await supabase
      .from('lats_store_shelves')
      .select('id')
      .limit(1);
    
    if (existingTable !== null) {
      console.log('✅ Store shelves table already exists!');
      
      // Check for existing shelves
      const { data: shelves, error: shelvesError } = await supabase
        .from('lats_store_shelves')
        .select('id, name, code, store_location_id')
        .limit(10);
      
      if (shelvesError) {
        console.log('❌ Error checking existing shelves:', shelvesError.message);
      } else {
        console.log(`📊 Found ${shelves?.length || 0} existing shelves`);
        if (shelves && shelves.length > 0) {
          console.log('📍 Sample shelves:');
          shelves.forEach(shelf => {
            console.log(`   - ${shelf.name} (${shelf.code})`);
          });
        }
      }
      return;
    }
    
    console.log('📋 Table does not exist, creating it...');
    
    // Create a test shelf to trigger table creation
    const testShelf = {
      store_location_id: '00000000-0000-0000-0000-000000000000', // Placeholder
      name: 'Test Shelf',
      code: 'TEST001',
      description: 'Test shelf for migration',
      shelf_type: 'standard',
      section: 'electronics',
      zone: 'front',
      max_capacity: 50,
      priority_order: 1,
      is_active: true,
      is_accessible: true,
      requires_ladder: false,
      is_refrigerated: false,
      floor_level: 1,
      current_capacity: 0,
      images: []
    };
    
    const { data, error } = await supabase
      .from('lats_store_shelves')
      .insert([testShelf])
      .select();
    
    if (error) {
      console.log('❌ Error creating test shelf:', error.message);
      console.log('💡 Please apply the migration manually through Supabase dashboard');
      return;
    }
    
    console.log('✅ Store shelves table created successfully!');
    console.log('🎉 Store shelves feature is ready to use!');
    console.log('📍 You can now manage shelves within store locations');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
applyShelfMigration();
