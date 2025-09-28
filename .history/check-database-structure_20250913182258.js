// Check database structure for price editing functionality
import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure for price editing...\n');

  try {
    // Check if repair_price column exists in devices table
    console.log('1. Checking devices table structure...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .limit(1);

    if (devicesError) {
      console.error('❌ Error accessing devices table:', devicesError.message);
      if (devicesError.message.includes('repair_price')) {
        console.log('💡 The repair_price column is missing. You need to apply the migration:');
        console.log('   supabase/migrations/20250131000016_add_repair_price_to_devices.sql');
      }
    } else {
      console.log('✅ Devices table accessible');
      if (devices && devices.length > 0) {
        const device = devices[0];
        if ('repair_price' in device) {
          console.log('✅ repair_price column exists');
        } else {
          console.log('❌ repair_price column missing');
        }
      }
    }

    // Check if device_price_history table exists
    console.log('\n2. Checking device_price_history table...');
    const { data: priceHistory, error: historyError } = await supabase
      .from('device_price_history')
      .select('*')
      .limit(1);

    if (historyError) {
      console.error('❌ Error accessing device_price_history table:', historyError.message);
      console.log('💡 The device_price_history table is missing. You need to apply the migration:');
      console.log('   supabase/migrations/20250131000017_create_device_price_history_table.sql');
    } else {
      console.log('✅ device_price_history table accessible');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Apply the database migrations if they are missing');
    console.log('2. Test the payment modal with a device that has allowPriceEdit=true');
    console.log('3. Make a payment higher than the original amount');
    console.log('4. Check if the price edit section appears');

  } catch (error) {
    console.error('❌ Error checking database structure:', error);
  }
}

checkDatabaseStructure();
