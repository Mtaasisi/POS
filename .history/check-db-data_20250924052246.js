// Check what's actually in the database
import { createClient } from '@supabase/supabase-js';

// Use the same configuration as your app
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkDatabaseData() {
  console.log('🔍 Checking what\'s actually in the database...\n');

  try {
    // Check the specific spare part
    console.log('🎯 Looking for spare part ID: 76a63fde-e388-4fe9-82e8-93bb5f68b37a');
    const { data: specificPart, error: specificError } = await supabase
      .from('lats_spare_parts')
      .select('*')
      .eq('id', '76a63fde-e388-4fe9-82e8-93bb5f68b37a')
      .single();

    if (specificError) {
      console.error('❌ Error fetching specific part:', specificError);
    } else if (specificPart) {
      console.log('✅ Found the spare part:');
      console.log(`   Name: "${specificPart.name}"`);
      console.log(`   Part Number: "${specificPart.part_number}"`);
      console.log(`   Brand: "${specificPart.brand}"`);
      console.log(`   Updated At: ${specificPart.updated_at}`);
    } else {
      console.log('⚠️ Spare part not found');
    }

    console.log('\n📋 All spare parts in database:');
    const { data: allParts, error: allError } = await supabase
      .from('lats_spare_parts')
      .select('id, name, part_number, brand, updated_at')
      .order('updated_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all parts:', allError);
    } else {
      console.log(`📊 Total spare parts: ${allParts?.length || 0}`);
      if (allParts && allParts.length > 0) {
        allParts.forEach((part, index) => {
          console.log(`   ${index + 1}. "${part.name}" (${part.part_number}) - ${part.brand} - Updated: ${part.updated_at}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // Try to connect to see what the actual error is
    console.log('\n🔧 Testing basic connection...');
    try {
      const { data, error: testError } = await supabase
        .from('lats_storage_rooms')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Connection test failed:', testError.message);
      } else {
        console.log('✅ Basic connection works, but spare parts table might have issues');
      }
    } catch (connError) {
      console.error('❌ Connection completely failed:', connError.message);
    }
  }
}

checkDatabaseData().catch(console.error);
