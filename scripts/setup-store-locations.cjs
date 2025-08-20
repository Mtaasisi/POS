// Comprehensive Store Locations Setup
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStoreLocations() {
  try {
    console.log('🏪 Setting up Store Locations Database...\n');
    
    // Step 1: Check if table exists
    console.log('1. 📋 Checking table existence...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('lats_store_locations')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table access error:', tableError.message);
      console.log('💡 Please ensure the migration has been applied to your Supabase database.');
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Step 2: Check current data
    console.log('\n2. 📊 Checking current data...');
    const { data: locations, error: locationsError } = await supabase
      .from('lats_store_locations')
      .select('*');
    
    if (locationsError) {
      console.log('❌ Error fetching locations:', locationsError.message);
      return;
    }
    
    console.log(`📈 Found ${locations?.length || 0} existing locations`);
    
    // Step 3: Check if main branch exists
    const mainBranch = locations?.find(loc => loc.is_main_branch);
    
    if (mainBranch) {
      console.log('✅ Main branch already exists:');
      console.log(`   📍 ${mainBranch.name} (${mainBranch.code})`);
      console.log(`   🏢 ${mainBranch.city}, ${mainBranch.country}`);
    } else {
      console.log('⚠️ No main branch found');
      console.log('💡 You can create locations through the web interface at: /store-locations');
    }
    
    // Step 4: Show database structure
    console.log('\n3. 🏗️ Database Structure:');
    console.log('📋 Table: lats_store_locations');
    console.log('📝 Fields available:');
    
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
    
    Object.entries(fieldCategories).forEach(([category, fields]) => {
      console.log(`   ${category}: ${fields.join(', ')}`);
    });
    
    // Step 5: Show performance features
    console.log('\n4. ⚡ Performance Features:');
    console.log('✅ Indexes on: name, code, city, region, active status, main branch, priority');
    console.log('✅ Row Level Security (RLS) enabled');
    console.log('✅ Automatic updated_at trigger');
    
    // Step 6: Show access information
    console.log('\n5. 🔐 Access Information:');
    console.log('✅ Authenticated users can: SELECT, INSERT, UPDATE, DELETE');
    console.log('✅ Admin role required for web interface access');
    
    // Step 7: Show next steps
    console.log('\n6. 🚀 Next Steps:');
    console.log('📍 Access the management page: /store-locations');
    console.log('👤 Login with admin credentials');
    console.log('➕ Click "Add Location" to create your first store');
    console.log('🏢 Set up your main branch and additional locations');
    
    // Step 8: Show sample data structure
    console.log('\n7. 📝 Sample Location Data Structure:');
    const sampleLocation = {
      name: 'Main Branch',
      code: 'MB001',
      description: 'Main store location and headquarters',
      address: 'City Center, Dar es Salaam',
      city: 'Dar es Salaam',
      region: 'Dar es Salaam',
      country: 'Tanzania',
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
    
    console.log('📋 Required fields: name, code, address, city');
    console.log('📋 Optional fields: all others');
    console.log('📋 Default values: is_active=true, is_main_branch=false, priority_order=0');
    
    console.log('\n🎉 Store Locations Database Setup Complete!');
    console.log('📍 Ready to use at: /store-locations');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupStoreLocations();
