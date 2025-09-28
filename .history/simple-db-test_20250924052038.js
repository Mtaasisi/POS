// Simple Database Connection Test
import { createClient } from '@supabase/supabase-js';

// Configuration (same as in supabaseClient.ts)
const getConfig = () => {
  // Try to get configuration from environment variables first
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    console.log('🌐 Using remote Supabase configuration from environment variables');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to local development configuration
  console.log('🏠 Using local Supabase configuration (fallback)');
  return {
    url: 'http://127.0.0.1:54321',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  };
};

const config = getConfig();

// Create Supabase client
const supabase = createClient(config.url, config.key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  console.log('🔧 Configuration:', {
    url: config.url,
    key: config.key ? `${config.key.substring(0, 20)}...` : 'MISSING'
  });
  console.log('');

  // Test 1: Basic connection test
  console.log('📡 Test 1: Basic Connection');
  try {
    const { data, error } = await supabase
      .from('lats_storage_rooms')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Basic connection successful');
    }
  } catch (err) {
    console.error('❌ Connection exception:', err.message);
    return false;
  }

  // Test 2: Spare parts table
  console.log('\n🔧 Test 2: Spare Parts Table');
  try {
    const { data, error, count } = await supabase
      .from('lats_spare_parts')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (error) {
      console.error('❌ Spare parts table error:', error.message);
    } else {
      console.log('✅ Spare parts table accessible');
      console.log(`📊 Total records: ${count}`);
      if (data && data.length > 0) {
        console.log('📋 Sample records:');
        data.forEach((part, index) => {
          console.log(`   ${index + 1}. ${part.name} (${part.part_number}) - ID: ${part.id}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Spare parts exception:', err.message);
  }

  // Test 3: Categories table
  console.log('\n📂 Test 3: Categories Table');
  try {
    const { data, error, count } = await supabase
      .from('lats_categories')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (error) {
      console.error('❌ Categories table error:', error.message);
    } else {
      console.log('✅ Categories table accessible');
      console.log(`📊 Total records: ${count}`);
      if (data && data.length > 0) {
        console.log('📋 Sample records:');
        data.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.name} - ID: ${cat.id}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Categories exception:', err.message);
  }

  // Test 4: Suppliers table
  console.log('\n🏢 Test 4: Suppliers Table');
  try {
    const { data, error, count } = await supabase
      .from('lats_suppliers')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (error) {
      console.error('❌ Suppliers table error:', error.message);
    } else {
      console.log('✅ Suppliers table accessible');
      console.log(`📊 Total records: ${count}`);
      if (data && data.length > 0) {
        console.log('📋 Sample records:');
        data.forEach((supp, index) => {
          console.log(`   ${index + 1}. ${supp.name} - ID: ${supp.id}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Suppliers exception:', err.message);
  }

  // Test 5: Test the specific spare part that was updated
  console.log('\n🎯 Test 5: Specific Spare Part (iPhone 6 LCD)');
  try {
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .select('*')
      .eq('id', '76a63fde-e388-4fe9-82e8-93bb5f68b37a')
      .single();
    
    if (error) {
      console.error('❌ Specific spare part error:', error.message);
    } else if (data) {
      console.log('✅ Found the specific spare part:');
      console.log(`   Name: ${data.name}`);
      console.log(`   Part Number: ${data.part_number}`);
      console.log(`   Brand: ${data.brand}`);
      console.log(`   Category ID: ${data.category_id}`);
      console.log(`   Supplier ID: ${data.supplier_id}`);
      console.log(`   Updated At: ${data.updated_at}`);
    } else {
      console.log('⚠️ Spare part not found');
    }
  } catch (err) {
    console.error('❌ Specific spare part exception:', err.message);
  }

  console.log('\n🏁 Database Connection Test Complete!');
  return true;
}

// Run the test
testDatabaseConnection().catch(console.error);
