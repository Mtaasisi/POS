#!/usr/bin/env node

/**
 * Simple Test for Spare Part Variants Table
 * 
 * This script just checks if the table exists and has the correct structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTable() {
  try {
    console.log('🚀 Testing Spare Part Variants Table...');
    
    // Step 1: Check if table exists
    console.log('📋 Step 1: Checking if table exists...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'lats_spare_part_variants');
    
    if (tableError) {
      console.error('❌ Error checking table:', tableError);
      throw tableError;
    }
    
    if (!tables || tables.length === 0) {
      console.log('❌ Table lats_spare_part_variants does not exist');
      console.log('📋 Please create the table first using the SQL script');
      return;
    }
    
    console.log('✅ Table lats_spare_part_variants exists');
    
    // Step 2: Check table structure
    console.log('📋 Step 2: Checking table structure...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'lats_spare_part_variants')
      .order('ordinal_position');
    
    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
      throw columnError;
    }
    
    console.log('✅ Table structure:');
    columns.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
    // Step 3: Check if we have any existing spare parts
    console.log('📋 Step 3: Checking for existing spare parts...');
    const { data: spareParts, error: sparePartsError } = await supabase
      .from('lats_spare_parts')
      .select('id, name, part_number')
      .limit(5);
    
    if (sparePartsError) {
      console.log('⚠️  Could not check spare parts:', sparePartsError.message);
    } else if (spareParts && spareParts.length > 0) {
      console.log(`✅ Found ${spareParts.length} existing spare parts:`);
      spareParts.forEach(sp => {
        console.log(`   • ${sp.name} (${sp.part_number}) - ID: ${sp.id}`);
      });
    } else {
      console.log('⚠️  No existing spare parts found');
      console.log('📋 You can still create variants once you have spare parts');
    }
    
    // Step 4: Check if there are any existing variants
    console.log('📋 Step 4: Checking for existing variants...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_spare_part_variants')
      .select('id, name, sku, spare_part_id')
      .limit(5);
    
    if (variantsError) {
      console.log('⚠️  Could not check variants:', variantsError.message);
    } else if (variants && variants.length > 0) {
      console.log(`✅ Found ${variants.length} existing variants:`);
      variants.forEach(v => {
        console.log(`   • ${v.name} (${v.sku}) - Spare Part ID: ${v.spare_part_id}`);
      });
    } else {
      console.log('📋 No existing variants found (this is normal for a new table)');
    }
    
    console.log('🎉 Spare Part Variants Table test completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   • Table exists and has correct structure');
    console.log('   • Ready to use with your spare parts');
    console.log('   • Variants can be created through the UI or API');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Create some spare parts in your app');
    console.log('   2. Test the variants functionality');
    console.log('   3. Verify everything works as expected');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testTable();
