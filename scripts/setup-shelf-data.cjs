#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupShelfData() {
  try {
    console.log('🏪 Setting up shelf data...\n');
    
    // Check if we have any store locations
    console.log('1. 📋 Checking existing store locations...');
    const { data: existingLocations, error: locCheckError } = await supabase
      .from('lats_store_locations')
      .select('id, name, code')
      .limit(5);
    
    if (locCheckError) {
      console.log('❌ Error checking locations:', locCheckError.message);
      return;
    }
    
    console.log(`📊 Found ${existingLocations?.length || 0} existing locations`);
    
    let locationId;
    
    if (existingLocations && existingLocations.length > 0) {
      locationId = existingLocations[0].id;
      console.log(`✅ Using existing location: ${existingLocations[0].name} (${existingLocations[0].code})`);
    } else {
      console.log('📋 No locations found, creating sample location...');
      
      // Create a sample store location
      const { data: location, error: locError } = await supabase
        .from('lats_store_locations')
        .insert([{
          name: 'Main Store',
          code: 'MAIN001',
          city: 'Dar es Salaam',
          address: '123 Main Street',
          phone: '+255123456789',
          email: 'main@store.com',
          is_active: true,
          created_by: null, // Will be set by RLS
          updated_by: null
        }])
        .select()
        .single();
      
      if (locError) {
        console.log('❌ Error creating location:', locError.message);
        console.log('💡 This might be due to RLS policies. Please create a store location manually through the UI first.');
        return;
      }
      
      locationId = location.id;
      console.log(`✅ Created location: ${location.name} (${location.code})`);
    }
    
    // Check if we have any storage rooms
    console.log('\n2. 📋 Checking existing storage rooms...');
    const { data: existingRooms, error: roomCheckError } = await supabase
      .from('lats_storage_rooms')
      .select('id, name, code, store_location_id')
      .eq('store_location_id', locationId)
      .limit(5);
    
    if (roomCheckError) {
      console.log('❌ Error checking rooms:', roomCheckError.message);
      return;
    }
    
    console.log(`📊 Found ${existingRooms?.length || 0} existing rooms for this location`);
    
    let roomId;
    
    if (existingRooms && existingRooms.length > 0) {
      roomId = existingRooms[0].id;
      console.log(`✅ Using existing room: ${existingRooms[0].name} (${existingRooms[0].code})`);
    } else {
      console.log('📋 No rooms found, creating sample room...');
      
      // Create a sample storage room
      const { data: room, error: roomError } = await supabase
        .from('lats_storage_rooms')
        .insert([{
          store_location_id: locationId,
          name: 'Main Storage Room',
          code: 'ROOM001',
          description: 'Main storage room for electronics and accessories',
          floor_level: 1,
          max_capacity: 1000,
          current_capacity: 0,
          is_active: true,
          is_secure: false,
          created_by: null,
          updated_by: null
        }])
        .select()
        .single();
      
      if (roomError) {
        console.log('❌ Error creating room:', roomError.message);
        console.log('💡 This might be due to RLS policies. Please create a storage room manually through the UI first.');
        return;
      }
      
      roomId = room.id;
      console.log(`✅ Created room: ${room.name} (${room.code})`);
    }
    
    // Check if we have any shelves
    console.log('\n3. 📋 Checking existing shelves...');
    const { data: existingShelves, error: shelfCheckError } = await supabase
      .from('lats_store_shelves')
      .select('id, name, code, storage_room_id')
      .eq('storage_room_id', roomId)
      .limit(5);
    
    if (shelfCheckError) {
      console.log('❌ Error checking shelves:', shelfCheckError.message);
      return;
    }
    
    console.log(`📊 Found ${existingShelves?.length || 0} existing shelves for this room`);
    
    if (existingShelves && existingShelves.length > 0) {
      console.log('✅ Sample shelves already exist:');
      existingShelves.forEach(shelf => {
        console.log(`   - ${shelf.name} (${shelf.code})`);
      });
    } else {
      console.log('📋 No shelves found, creating sample shelves...');
      
      // Create sample shelves
      const sampleShelves = [
        {
          store_location_id: locationId,
          storage_room_id: roomId,
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
          store_location_id: locationId,
          storage_room_id: roomId,
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
        },
        {
          store_location_id: locationId,
          storage_room_id: roomId,
          name: 'Parts Shelf',
          code: 'SHELF003',
          description: 'Shelf for repair parts',
          shelf_type: 'specialty',
          section: 'parts',
          zone: 'left',
          row_number: 2,
          column_number: 1,
          max_capacity: 75,
          priority_order: 3,
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
        console.log('💡 This might be due to RLS policies. Please create shelves manually through the UI.');
        return;
      }
      
      console.log(`✅ Created ${shelves?.length || 0} sample shelves:`);
      shelves?.forEach(shelf => {
        console.log(`   - ${shelf.name} (${shelf.code})`);
      });
    }
    
    console.log('\n🎉 Shelf data setup completed!');
    console.log('📍 You can now test shelf creation in the UI');
    console.log(`📍 Location: ${locationId}`);
    console.log(`📍 Room: ${roomId}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupShelfData();
