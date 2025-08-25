import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createSampleStorageData() {
  console.log('🔍 Checking for existing storage data...');

  try {
    // Check if store locations exist
    const { data: locations, error: locationsError } = await supabase
      .from('lats_store_locations')
      .select('*')
      .limit(1);

    if (locationsError) {
      console.error('Error checking store locations:', locationsError);
      return;
    }

    let storeLocationId;
    if (locations && locations.length > 0) {
      storeLocationId = locations[0].id;
      console.log('✅ Found existing store location:', locations[0].name);
    } else {
      // Create a sample store location
      console.log('📝 Creating sample store location...');
      const { data: newLocation, error: createLocationError } = await supabase
        .from('lats_store_locations')
        .insert([{
          name: 'Main Store',
          code: 'MAIN',
          city: 'Dar es Salaam',
          country: 'TZ',
          is_active: true
        }])
        .select()
        .single();

      if (createLocationError) {
        console.error('Error creating store location:', createLocationError);
        return;
      }

      storeLocationId = newLocation.id;
      console.log('✅ Created store location:', newLocation.name);
    }

    // Check if storage rooms exist
    const { data: rooms, error: roomsError } = await supabase
      .from('lats_storage_rooms')
      .select('*')
      .limit(1);

    if (roomsError) {
      console.error('Error checking storage rooms:', roomsError);
      return;
    }

    let storageRoomId;
    if (rooms && rooms.length > 0) {
      storageRoomId = rooms[0].id;
      console.log('✅ Found existing storage room:', rooms[0].name);
    } else {
      // Create a sample storage room
      console.log('📝 Creating sample storage room...');
      const { data: newRoom, error: createRoomError } = await supabase
        .from('lats_storage_rooms')
        .insert([{
          store_location_id: storeLocationId,
          name: 'Main Storage Room',
          code: 'STOR001',
          description: 'Main storage area for products',
          floor_level: 1,
          area_sqm: 100,
          max_capacity: 1000,
          current_capacity: 0,
          is_active: true,
          is_secure: false,
          requires_access_card: false
        }])
        .select()
        .single();

      if (createRoomError) {
        console.error('Error creating storage room:', createRoomError);
        return;
      }

      storageRoomId = newRoom.id;
      console.log('✅ Created storage room:', newRoom.name);
    }

    // Check if shelves exist
    const { data: shelves, error: shelvesError } = await supabase
      .from('lats_store_shelves')
      .select('*')
      .limit(1);

    if (shelvesError) {
      console.error('Error checking shelves:', shelvesError);
      return;
    }

    if (shelves && shelves.length > 0) {
      console.log('✅ Found existing shelves:', shelves.length);
    } else {
      // Create sample shelves
      console.log('📝 Creating sample shelves...');
      const sampleShelves = [
        {
          store_location_id: storeLocationId,
          storage_room_id: storageRoomId,
          name: 'Shelf A1',
          code: 'A1',
          description: 'Electronics shelf',
          shelf_type: 'standard',
          section: 'electronics',
          row_number: 1,
          column_number: 1,
          max_capacity: 50,
          current_capacity: 0,
          floor_level: 1,
          is_active: true,
          is_accessible: true,
          requires_ladder: false,
          is_refrigerated: false,
          priority_order: 1
        },
        {
          store_location_id: storeLocationId,
          storage_room_id: storageRoomId,
          name: 'Shelf A2',
          code: 'A2',
          description: 'Accessories shelf',
          shelf_type: 'standard',
          section: 'accessories',
          row_number: 1,
          column_number: 2,
          max_capacity: 50,
          current_capacity: 0,
          floor_level: 1,
          is_active: true,
          is_accessible: true,
          requires_ladder: false,
          is_refrigerated: false,
          priority_order: 2
        },
        {
          store_location_id: storeLocationId,
          storage_room_id: storageRoomId,
          name: 'Shelf B1',
          code: 'B1',
          description: 'Parts shelf',
          shelf_type: 'standard',
          section: 'parts',
          row_number: 2,
          column_number: 1,
          max_capacity: 50,
          current_capacity: 0,
          floor_level: 1,
          is_active: true,
          is_accessible: true,
          requires_ladder: false,
          is_refrigerated: false,
          priority_order: 3
        }
      ];

      const { data: newShelves, error: createShelvesError } = await supabase
        .from('lats_store_shelves')
        .insert(sampleShelves)
        .select();

      if (createShelvesError) {
        console.error('Error creating shelves:', createShelvesError);
        return;
      }

      console.log('✅ Created', newShelves.length, 'sample shelves');
    }

    console.log('🎉 Sample storage data setup complete!');
    console.log('You can now test the AddProductPage with storage room and shelf selection.');

  } catch (error) {
    console.error('❌ Error setting up sample storage data:', error);
  }
}

createSampleStorageData();
