// Insert Default Store Location
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertDefaultLocation() {
  try {
    console.log('🏪 Inserting default store location...\n');
    
    // Check if main branch already exists
    const { data: existingMain, error: checkError } = await supabase
      .from('lats_store_locations')
      .select('id, name, code')
      .eq('is_main_branch', true)
      .single();
    
    if (existingMain) {
      console.log('✅ Main branch already exists:');
      console.log(`   📍 ${existingMain.name} (${existingMain.code})`);
      return;
    }
    
    // Create default main branch
    const defaultLocation = {
      name: 'Main Branch',
      code: 'MB001',
      description: 'Main store location and headquarters',
      address: 'City Center, Dar es Salaam',
      city: 'Dar es Salaam',
      region: 'Dar es Salaam',
      country: 'Tanzania',
      postal_code: '11101',
      phone: '+255 22 123 4567',
      email: 'main@latschance.com',
      whatsapp: '+255 712 345 678',
      manager_name: 'Store Manager',
      manager_phone: '+255 712 345 678',
      manager_email: 'manager@latschance.com',
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
      has_parking: true,
      has_wifi: true,
      has_repair_service: true,
      has_sales_service: true,
      has_delivery_service: true,
      store_size_sqm: 200,
      max_capacity: 50,
      current_staff_count: 10,
      is_active: true,
      is_main_branch: true,
      priority_order: 1,
      monthly_rent: 500000,
      utilities_cost: 100000,
      monthly_target: 5000000,
      notes: 'Main branch with full services',
      images: []
    };
    
    const { data: newLocation, error: insertError } = await supabase
      .from('lats_store_locations')
      .insert([defaultLocation])
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Error inserting default location:', insertError.message);
      return;
    }
    
    console.log('✅ Default main branch created successfully!');
    console.log(`📍 Location: ${newLocation.name} (${newLocation.code})`);
    console.log(`🏢 Address: ${newLocation.address}, ${newLocation.city}`);
    console.log(`📞 Phone: ${newLocation.phone}`);
    console.log(`📧 Email: ${newLocation.email}`);
    console.log(`👥 Staff: ${newLocation.current_staff_count} employees`);
    console.log(`💰 Monthly Target: ${newLocation.monthly_target?.toLocaleString()} TZS`);
    
    console.log('\n🎉 Default location setup completed!');
    console.log('📍 You can now access the store locations page at: /store-locations');
    
  } catch (error) {
    console.error('❌ Failed to insert default location:', error);
  }
}

// Run the script
insertDefaultLocation();
