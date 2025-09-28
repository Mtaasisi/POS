// Browser Database Test - Run this in your browser console
// Copy and paste this code into your browser's developer console

console.log('🔍 Browser Database Test - Checking what\'s actually in the database...\n');

// Get the supabase client from your app
const { supabase } = await import('./src/lib/supabaseClient.ts');

async function checkDatabaseData() {
  try {
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
      console.log(`   Category ID: ${specificPart.category_id}`);
      console.log(`   Supplier ID: ${specificPart.supplier_id}`);
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

    console.log('\n🔧 Supabase Configuration:');
    console.log('URL:', supabase.supabaseUrl);
    console.log('Key:', supabase.supabaseKey ? `${supabase.supabaseKey.substring(0, 20)}...` : 'MISSING');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseData();

// Also test the specific update that was supposed to happen
console.log('\n🔄 Testing a simple update to see if it persists...');

async function testUpdate() {
  try {
    // Try to update the spare part name to test if updates persist
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .update({ 
        name: 'TEST UPDATE - ' + new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', '76a63fde-e388-4fe9-82e8-93bb5f68b37a')
      .select()
      .single();

    if (error) {
      console.error('❌ Update test failed:', error);
    } else {
      console.log('✅ Update test successful:', data);
      
      // Wait a moment and check if it persisted
      setTimeout(async () => {
        const { data: checkData, error: checkError } = await supabase
          .from('lats_spare_parts')
          .select('name, updated_at')
          .eq('id', '76a63fde-e388-4fe9-82e8-93bb5f68b37a')
          .single();
        
        if (checkError) {
          console.error('❌ Persistence check failed:', checkError);
        } else {
          console.log('✅ Persistence check:', checkData);
        }
      }, 1000);
    }
  } catch (error) {
    console.error('❌ Update test exception:', error);
  }
}

testUpdate();
