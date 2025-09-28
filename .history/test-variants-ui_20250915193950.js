// Test script to verify variants are loaded in spare parts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with local configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVariantsInSpareParts() {
  console.log('🧪 Testing if spare parts now include variants data...\n');

  try {
    // Test the updated query that includes variants
    console.log('1️⃣ Testing updated spare parts query with variants...');
    const { data: spareParts, error } = await supabase
      .from('lats_spare_parts')
      .select(`
        *,
        category:lats_categories(name),
        supplier:lats_suppliers(name, email, phone),
        variants:lats_spare_part_variants(*)
      `)
      .limit(5);

    if (error) {
      console.error('❌ Error querying spare parts:', error.message);
      return;
    }

    console.log(`✅ Query successful! Found ${spareParts?.length || 0} spare parts`);
    
    if (spareParts && spareParts.length > 0) {
      console.log('\n📋 Sample spare parts with variants data:');
      spareParts.forEach((part, index) => {
        console.log(`\n${index + 1}. ${part.name}`);
        console.log(`   - Part Number: ${part.part_number}`);
        console.log(`   - Category: ${part.category?.name || 'N/A'}`);
        console.log(`   - Supplier: ${part.supplier?.name || 'N/A'}`);
        console.log(`   - Variants: ${part.variants?.length || 0} variants`);
        
        if (part.variants && part.variants.length > 0) {
          console.log('   - Variant Details:');
          part.variants.forEach((variant, vIndex) => {
            console.log(`     ${vIndex + 1}. ${variant.name} (SKU: ${variant.sku})`);
            console.log(`        Stock: ${variant.quantity}, Price: ${variant.selling_price}`);
            if (variant.variant_attributes) {
              console.log(`        Attributes: ${Object.keys(variant.variant_attributes).length} specs`);
            }
          });
        }
      });

      // Check if any spare parts have variants
      const partsWithVariants = spareParts.filter(part => part.variants && part.variants.length > 0);
      console.log(`\n📊 Summary:`);
      console.log(`   - Total spare parts: ${spareParts.length}`);
      console.log(`   - Parts with variants: ${partsWithVariants.length}`);
      console.log(`   - Parts without variants: ${spareParts.length - partsWithVariants.length}`);
      
      if (partsWithVariants.length > 0) {
        console.log('\n🎉 SUCCESS! Variants data is now included in spare parts queries!');
        console.log('   The UI should now display variants information in the details page.');
      } else {
        console.log('\nℹ️  No spare parts with variants found, but the query structure is correct.');
        console.log('   The UI will show "No variants found" message, which is expected.');
      }
    } else {
      console.log('ℹ️  No spare parts found in the database.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testVariantsInSpareParts();
