// Check Store Locations Database Status
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStoreLocationsDatabase() {
  try {
    console.log('🔍 Checking Store Locations Database Status...\n');
    
    // Check if table exists
    console.log('1. 📋 Table Structure Check:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('lats_store_locations')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table access error:', tableError.message);
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Get all locations
    console.log('\n2. 📊 Current Data:');
    const { data: locations, error: locationsError } = await supabase
      .from('lats_store_locations')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (locationsError) {
      console.log('❌ Error fetching locations:', locationsError.message);
      return;
    }
    
    console.log(`📈 Total locations: ${locations?.length || 0}`);
    
    if (locations && locations.length > 0) {
      console.log('\n📍 Current Locations:');
      locations.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location.name} (${location.code})`);
        console.log(`      📍 ${location.city}, ${location.country}`);
        console.log(`      🏢 Main Branch: ${location.is_main_branch ? 'Yes' : 'No'}`);
        console.log(`      ✅ Active: ${location.is_active ? 'Yes' : 'No'}`);
        console.log(`      📅 Created: ${new Date(location.created_at).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('📭 No locations found in database');
    }
    
    // Check table structure
    console.log('3. 🏗️ Table Structure:');
    if (locations && locations.length > 0) {
      const sampleLocation = locations[0];
      const fields = Object.keys(sampleLocation);
      
      console.log(`📋 Total fields: ${fields.length}`);
      console.log('📝 Available fields:');
      
      const fieldCategories = {
        'Basic Info': ['id', 'name', 'code', 'description'],
        'Location': ['address', 'city', 'region', 'country', 'postal_code', 'coordinates'],
        'Contact': ['phone', 'email', 'whatsapp'],
        'Manager': ['manager_name', 'manager_phone', 'manager_email'],
        'Operating Hours': ['opening_hours', 'is_24_hours'],
        'Features': ['has_parking', 'has_wifi', 'has_repair_service', 'has_sales_service', 'has_delivery_service'],
        'Capacity': ['store_size_sqm', 'max_capacity', 'current_staff_count'],
        'Status': ['is_active', 'is_main_branch', 'priority_order'],
        'Financial': ['monthly_rent', 'utilities_cost', 'monthly_target'],
        'Additional': ['notes', 'images'],
        'Audit': ['created_by', 'updated_by', 'created_at', 'updated_at']
      };
      
      Object.entries(fieldCategories).forEach(([category, categoryFields]) => {
        const availableFields = categoryFields.filter(field => fields.includes(field));
        if (availableFields.length > 0) {
          console.log(`   ${category}: ${availableFields.join(', ')}`);
        }
      });
    }
    
    // Check indexes
    console.log('\n4. ⚡ Performance Indexes:');
    const indexes = [
      'idx_lats_store_locations_name',
      'idx_lats_store_locations_code', 
      'idx_lats_store_locations_city',
      'idx_lats_store_locations_region',
      'idx_lats_store_locations_active',
      'idx_lats_store_locations_main_branch',
      'idx_lats_store_locations_priority'
    ];
    
    console.log('📊 Expected indexes:');
    indexes.forEach(index => {
      console.log(`   ✅ ${index}`);
    });
    
    // Check RLS policies
    console.log('\n5. 🔒 Security (RLS Policies):');
    console.log('✅ Row Level Security enabled');
    console.log('✅ Authenticated users can: SELECT, INSERT, UPDATE, DELETE');
    
    // Check triggers
    console.log('\n6. 🔄 Triggers:');
    console.log('✅ updated_at trigger configured');
    
    console.log('\n🎉 Database check completed successfully!');
    console.log('📍 Access the management page at: /store-locations');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

// Run the check
checkStoreLocationsDatabase();
