// Test script to create a variant for the iPhone 6 LCD spare part
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with local configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestVariant() {
  console.log('🧪 Creating a test variant for iPhone 6 LCD...\n');

  try {
    // First, find the iPhone 6 LCD spare part
    console.log('1️⃣ Finding iPhone 6 LCD spare part...');
    const { data: spareParts, error: findError } = await supabase
      .from('lats_spare_parts')
      .select('id, name, part_number')
      .eq('name', 'iPhone 6 LCD')
      .limit(1);

    if (findError) {
      console.error('❌ Error finding spare part:', findError.message);
      return;
    }

    if (!spareParts || spareParts.length === 0) {
      console.log('ℹ️  iPhone 6 LCD spare part not found. Available spare parts:');
      const { data: allParts } = await supabase
        .from('lats_spare_parts')
        .select('id, name, part_number')
        .limit(5);
      
      allParts?.forEach(part => {
        console.log(`   - ${part.name} (${part.part_number})`);
      });
      return;
    }

    const sparePart = spareParts[0];
    console.log(`✅ Found spare part: ${sparePart.name} (ID: ${sparePart.id})`);

    // Create a test variant
    console.log('\n2️⃣ Creating test variant...');
    const variantData = {
      spare_part_id: sparePart.id,
      name: 'Original Quality',
      sku: 'IPH6-LCD-ORIG',
      description: 'Original quality iPhone 6 LCD screen',
      quantity: 5,
      min_quantity: 2,
      cost_price: 25000,
      selling_price: 35000,
      variant_attributes: {
        quality: 'Original',
        color: 'Black',
        condition: 'New',
        warranty: '6 months',
        compatibility: 'iPhone 6, iPhone 6 Plus'
      },
      is_active: true
    };

    const { data: variant, error: createError } = await supabase
      .from('lats_spare_part_variants')
      .insert([variantData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating variant:', createError.message);
      return;
    }

    console.log('✅ Test variant created successfully!');
    console.log(`   - Name: ${variant.name}`);
    console.log(`   - SKU: ${variant.sku}`);
    console.log(`   - Stock: ${variant.quantity}`);
    console.log(`   - Price: ${variant.selling_price}`);
    console.log(`   - Attributes: ${Object.keys(variant.variant_attributes).length} specs`);

    console.log('\n🎉 SUCCESS! Now refresh the spare parts page and open the iPhone 6 LCD details to see the variants section!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
createTestVariant();
