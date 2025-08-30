import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseTables() {
  console.log('🔍 Checking database tables for WhatsApp data...\n');

  // List of possible table names for WhatsApp instances
  const possibleTables = [
    'whatsapp_instances',
    'green_api_instances',
    'whatsapp_hub_instances',
    'instances',
    'whatsapp_connections',
    'green_api_connections'
  ];

  for (const tableName of possibleTables) {
    try {
      console.log(`📋 Checking table: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`   ❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`   ⚠️  Error accessing '${tableName}': ${error.message}`);
        }
      } else {
        console.log(`   ✅ Table '${tableName}' exists with ${data.length} records`);
        if (data.length > 0) {
          console.log(`   📊 Sample data:`, JSON.stringify(data[0], null, 2));
        }
      }
    } catch (err) {
      console.log(`   ❌ Error checking '${tableName}': ${err.message}`);
    }
  }

  // Also check for any tables with 'whatsapp' or 'green' in the name
  console.log('\n🔍 Searching for WhatsApp-related tables...');
  
  try {
    // This is a simplified approach - in a real scenario you'd need to query the information_schema
    const { data: tables, error } = await supabase
      .rpc('get_table_names'); // This would need to be a custom function

    if (error) {
      console.log('   ⚠️  Could not list all tables (this is normal)');
    } else if (tables) {
      const whatsappTables = tables.filter(name => 
        name.toLowerCase().includes('whatsapp') || 
        name.toLowerCase().includes('green') ||
        name.toLowerCase().includes('instance')
      );
      console.log(`   Found ${whatsappTables.length} related tables:`, whatsappTables);
    }
  } catch (err) {
    console.log('   ⚠️  Could not search for related tables');
  }
}

async function checkWhatsAppHubData() {
  console.log('\n📱 Checking WhatsApp Hub related data...\n');

  // Check for any data in common tables that might contain WhatsApp info
  const commonTables = [
    'settings',
    'configurations',
    'integrations',
    'api_keys',
    'connections'
  ];

  for (const tableName of commonTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (!error && data && data.length > 0) {
        console.log(`📋 Table '${tableName}' has ${data.length} records`);
        
        // Look for WhatsApp-related data
        const whatsappData = data.filter(item => 
          JSON.stringify(item).toLowerCase().includes('whatsapp') ||
          JSON.stringify(item).toLowerCase().includes('green') ||
          JSON.stringify(item).toLowerCase().includes('instance')
        );
        
        if (whatsappData.length > 0) {
          console.log(`   🎯 Found ${whatsappData.length} WhatsApp-related records in '${tableName}'`);
          console.log(`   📊 Sample:`, JSON.stringify(whatsappData[0], null, 2));
        }
      }
    } catch (err) {
      // Table doesn't exist or other error - skip
    }
  }
}

async function main() {
  console.log('🚀 Database Table Diagnostic Tool\n');
  
  await checkDatabaseTables();
  await checkWhatsAppHubData();
  
  console.log('\n✨ Diagnostic complete!');
  console.log('\n💡 If no WhatsApp instances are found:');
  console.log('1. You may need to create your first WhatsApp instance');
  console.log('2. Check if you have Green API credentials');
  console.log('3. Visit WhatsApp Hub in your app to set up instances');
}

main().catch(console.error);
