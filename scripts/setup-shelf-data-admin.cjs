#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with service role key for admin access
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupShelfDataAdmin() {
  try {
    console.log('🏪 Setting up shelf data with admin privileges...\n');
    
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
      
      // Create a sample store location with admin privileges
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
          created_by: '00000000-0000-0000-0000-000000000000', // System user
          updated_by: '00000000-0000-0000-0000-000000000000'
        }])
        .select()
        .single();
      
      if (locError) {
        console.log('❌ Error creating location:', locError.message);
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
      
      // Create a sample storage room with admin privileges
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
          created_by: '00000000-0000-0000-0000-000000000000', // System user
          updated_by: '00000000-0000-0000-0000-000000000000'
        }])
        .select()
        .single();
      
      if (roomError) {
        console.log('❌ Error creating room:', roomError.message);
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
      
      // Create sample shelves with admin privileges
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
          current_capacity: 0,
          created_by: '00000000-0000-0000-0000-000000000000', // System user
          updated_by: '00000000-0000-0000-0000-000000000000'
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
          current_capacity: 0,
          created_by: '00000000-0000-0000-0000-000000000000', // System user
          updated_by: '00000000-0000-0000-0000-000000000000'
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
          current_capacity: 0,
          created_by: '00000000-0000-0000-0000-000000000000', // System user
          updated_by: '00000000-0000-0000-0000-000000000000'
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
      
      console.log(`✅ Created ${shelves?.length || 0} sample shelves:`);
      shelves?.forEach(shelf => {
        console.log(`   - ${shelf.name} (${shelf.code})`);
      });
    }
    
    console.log('\n🎉 Shelf data setup completed with admin privileges!');
    console.log('📍 You can now test shelf creation in the UI');
    console.log(`📍 Location ID: ${locationId}`);
    console.log(`📍 Room ID: ${roomId}`);
    console.log('\n📋 Next steps:');
    console.log('1. Go to Storage Room Management in the UI');
    console.log('2. You should see the "Main Storage Room"');
    console.log('3. Click "Manage Shelves" to test shelf creation');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupShelfDataAdmin();
