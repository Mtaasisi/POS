#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with regular API key
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupShelfDataSimple() {
  try {
    console.log('🏪 Setting up shelf data (simple approach)...\n');
    
    // First, let's try to authenticate as a user
    console.log('1. 🔐 Attempting to authenticate...');
    
    // Try to sign in with a test user or create one
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (authError) {
      console.log('⚠️  Authentication failed, trying anonymous access...');
      console.log('   Error:', authError.message);
    } else {
      console.log('✅ Authenticated successfully');
    }
    
    // Try to create data with the current session
    console.log('\n2. 📋 Attempting to create store location...');
    
    const { data: location, error: locError } = await supabase
      .from('lats_store_locations')
      .insert([{
        name: 'Main Store',
        code: 'MAIN001',
        city: 'Dar es Salaam',
        address: '123 Main Street',
        phone: '+255123456789',
        email: 'main@store.com',
        is_active: true
      }])
      .select()
      .single();
    
    if (locError) {
      console.log('❌ Error creating location:', locError.message);
      console.log('\n💡 The issue is with Row Level Security (RLS) policies.');
      console.log('📋 To fix this, you need to:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to Authentication > Policies');
      console.log('   3. Find the lats_store_locations table');
      console.log('   4. Add a policy that allows INSERT for authenticated users');
      console.log('   5. Or temporarily disable RLS for testing');
      console.log('\n🔧 Alternative: Create the data manually through the UI');
      return;
    }
    
    console.log(`✅ Created location: ${location.name} (${location.code})`);
    
    // Create storage room
    console.log('\n3. 📋 Creating storage room...');
    const { data: room, error: roomError } = await supabase
      .from('lats_storage_rooms')
      .insert([{
        store_location_id: location.id,
        name: 'Main Storage Room',
        code: 'ROOM001',
        description: 'Main storage room for electronics and accessories',
        floor_level: 1,
        max_capacity: 1000,
        current_capacity: 0,
        is_active: true,
        is_secure: false
      }])
      .select()
      .single();
    
    if (roomError) {
      console.log('❌ Error creating room:', roomError.message);
      return;
    }
    
    console.log(`✅ Created room: ${room.name} (${room.code})`);
    
    // Create sample shelves
    console.log('\n4. 📋 Creating sample shelves...');
    const sampleShelves = [
      {
        store_location_id: location.id,
        storage_room_id: room.id,
        name: 'Main Display Shelf',
        code: 'SHELF001',
        description: 'Main display shelf for electronics',
        shelf_type: 'display',
        section: 'electronics',
        zone: 'front',
        row_number: 1,
        column_number: 1,
        max_capacity: 50,
        priority_order: 1,
        is_active: true,
        is_accessible: true,
        requires_ladder: false,
        is_refrigerated: false,
        floor_level: 1,
        current_capacity: 0
      },
      {
        store_location_id: location.id,
        storage_room_id: room.id,
        name: 'Storage Shelf A',
        code: 'SHELF002',
        description: 'Storage shelf for accessories',
        shelf_type: 'storage',
        section: 'accessories',
        zone: 'back',
        row_number: 1,
        column_number: 2,
        max_capacity: 100,
        priority_order: 2,
        is_active: true,
        is_accessible: true,
        requires_ladder: false,
        is_refrigerated: false,
        floor_level: 1,
        current_capacity: 0
      }
    ];
    
    const { data: shelves, error: shelfError } = await supabase
      .from('lats_store_shelves')
      .insert(sampleShelves)
      .select();
    
    if (shelfError) {
      console.log('❌ Error creating shelves:', shelfError.message);
      return;
    }
    
    console.log(`✅ Created ${shelves?.length || 0} sample shelves`);
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('📍 You can now test shelf creation in the UI');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupShelfDataSimple();
