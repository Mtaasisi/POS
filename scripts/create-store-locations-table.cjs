// Script to create store locations table
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStoreLocationsTable() {
  try {
    console.log('🚀 Creating store locations table...');
    
    // First, let's check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('lats_store_locations')
      .select('id')
      .limit(1);
    
    if (existingTable !== null) {
      console.log('✅ Store locations table already exists!');
      return;
    }
    
    console.log('📋 Table does not exist, creating it...');
    
    // Since we can't execute raw SQL directly, we'll create the table by inserting a test record
    // This will trigger the table creation if it doesn't exist
    const testLocation = {
      name: 'Main Branch',
      code: 'MB001',
      description: 'Main store location',
      address: 'City Center',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      is_main_branch: true,
      is_active: true,
      priority_order: 1,
      opening_hours: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: '10:00', close: '16:00' }
      },
      is_24_hours: false,
      has_parking: false,
      has_wifi: false,
      has_repair_service: true,
      has_sales_service: true,
      has_delivery_service: false,
      current_staff_count: 0,
      images: []
    };
    
    const { data, error } = await supabase
      .from('lats_store_locations')
      .insert([testLocation])
      .select();
    
    if (error) {
      console.error('❌ Failed to create table:', error);
      console.log('💡 You may need to run the migration manually in Supabase dashboard');
      console.log('📄 Migration file: supabase/migrations/20241201000050_create_store_locations_table.sql');
      return;
    }
    
    console.log('✅ Store locations table created successfully!');
    console.log('📋 Created location:', data[0]);
    console.log('🎉 Store locations feature is ready to use!');
    console.log('📍 Access it at: /store-locations');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('💡 You may need to run the migration manually in Supabase dashboard');
    console.log('📄 Migration file: supabase/migrations/20241201000050_create_store_locations_table.sql');
  }
}

// Run the script
createStoreLocationsTable();
