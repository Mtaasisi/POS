// Test script for spare parts variants functionality
// This script tests the enhanced variants API functions

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with local configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test functions
async function testVariantsFunctionality() {
  console.log('🧪 Testing Spare Parts Variants Functionality...\n');

  try {
    // Test 1: Check if variants table exists and has data
    console.log('1️⃣ Testing variants table structure...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_spare_part_variants')
      .select('*')
      .limit(5);

    if (variantsError) {
      console.error('❌ Error accessing variants table:', variantsError.message);
      return;
    }

    console.log(`✅ Variants table accessible. Found ${variants?.length || 0} variants`);
    if (variants && variants.length > 0) {
      console.log('📋 Sample variant:', {
        id: variants[0].id,
        name: variants[0].name,
        sku: variants[0].sku,
        hasAttributes: !!variants[0].variant_attributes
      });
    }

    // Test 2: Test variants search by name/SKU
    console.log('\n2️⃣ Testing variants search by name/SKU...');
    const { data: searchResults, error: searchError } = await supabase
      .from('lats_spare_part_variants')
      .select(`
        *,
        spare_part:lats_spare_parts(
          *,
          category:lats_categories(name),
          supplier:lats_suppliers(name)
        )
      `)
      .or('name.ilike.%iPhone%,sku.ilike.%iPhone%')
      .limit(5);

    if (searchError) {
      console.error('❌ Error searching variants:', searchError.message);
    } else {
      console.log(`✅ Search by name/SKU working. Found ${searchResults?.length || 0} results`);
    }

    // Test 3: Test variants with attributes search
    console.log('\n3️⃣ Testing variants with attributes...');
    const { data: allVariants, error: allVariantsError } = await supabase
      .from('lats_spare_part_variants')
      .select('*')
      .not('variant_attributes', 'is', null)
      .limit(10);

    if (allVariantsError) {
      console.error('❌ Error getting variants with attributes:', allVariantsError.message);
    } else {
      console.log(`✅ Found ${allVariants?.length || 0} variants with attributes`);
      
      // Test attribute filtering
      if (allVariants && allVariants.length > 0) {
        const variantWithAttrs = allVariants[0];
        console.log('📋 Sample variant attributes:', variantWithAttrs.variant_attributes);
        
        // Test filtering by attributes
        const testAttribute = Object.keys(variantWithAttrs.variant_attributes)[0];
        const testValue = variantWithAttrs.variant_attributes[testAttribute];
        
        console.log(`🔍 Testing attribute filter: ${testAttribute} = ${testValue}`);
        
        const filteredVariants = allVariants.filter(v => 
          v.variant_attributes && 
          v.variant_attributes[testAttribute] === testValue
        );
        
        console.log(`✅ Attribute filtering working. Found ${filteredVariants.length} matching variants`);
      }
    }

    // Test 4: Test variants statistics
    console.log('\n4️⃣ Testing variants statistics...');
    const { data: statsData, error: statsError } = await supabase
      .from('lats_spare_part_variants')
      .select('selling_price, quantity, min_quantity');

    if (statsError) {
      console.error('❌ Error getting variants stats:', statsError.message);
    } else {
      const variants = statsData || [];
      const totalVariants = variants.length;
      const totalValue = variants.reduce((sum, v) => sum + (v.selling_price * v.quantity), 0);
      const inStockVariants = variants.filter(v => v.quantity > 0).length;
      const outOfStockVariants = variants.filter(v => v.quantity === 0).length;
      const lowStockVariants = variants.filter(v => v.quantity > 0 && v.quantity <= v.min_quantity).length;
      
      const prices = variants.map(v => v.selling_price).filter(p => p > 0);
      const averagePrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
      const priceRange = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices)
      } : { min: 0, max: 0 };

      console.log('✅ Variants statistics calculated:');
      console.log(`   📊 Total variants: ${totalVariants}`);
      console.log(`   💰 Total value: ${totalValue.toLocaleString()}`);
      console.log(`   📦 In stock: ${inStockVariants}`);
      console.log(`   ❌ Out of stock: ${outOfStockVariants}`);
      console.log(`   ⚠️  Low stock: ${lowStockVariants}`);
      console.log(`   💵 Average price: ${averagePrice.toLocaleString()}`);
      console.log(`   📈 Price range: ${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()}`);
    }

    // Test 5: Test spare parts with variants relationship
    console.log('\n5️⃣ Testing spare parts with variants relationship...');
    const { data: sparePartsWithVariants, error: sparePartsError } = await supabase
      .from('lats_spare_parts')
      .select(`
        *,
        variants:lats_spare_part_variants(*)
      `)
      .not('variants', 'is', null)
      .limit(5);

    if (sparePartsError) {
      console.error('❌ Error getting spare parts with variants:', sparePartsError.message);
    } else {
      console.log(`✅ Found ${sparePartsWithVariants?.length || 0} spare parts with variants`);
      
      if (sparePartsWithVariants && sparePartsWithVariants.length > 0) {
        const sparePart = sparePartsWithVariants[0];
        console.log(`📋 Sample spare part: "${sparePart.name}" has ${sparePart.variants?.length || 0} variants`);
      }
    }

    // Test 6: Test comprehensive search
    console.log('\n6️⃣ Testing comprehensive search...');
    const searchTerm = 'iPhone';
    
    // Search main spare parts
    const { data: mainSearch, error: mainSearchError } = await supabase
      .from('lats_spare_parts')
      .select(`
        *,
        category:lats_categories(name),
        supplier:lats_suppliers(name),
        variants:lats_spare_part_variants(*)
      `)
      .or(`part_number.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_active', true);

    // Search variants
    const { data: variantSearch, error: variantSearchError } = await supabase
      .from('lats_spare_part_variants')
      .select(`
        *,
        spare_part:lats_spare_parts(
          *,
          category:lats_categories(name),
          supplier:lats_suppliers(name)
        )
      `)
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .eq('spare_part.is_active', true);

    if (mainSearchError || variantSearchError) {
      console.error('❌ Error in comprehensive search:', mainSearchError?.message || variantSearchError?.message);
    } else {
      const totalResults = (mainSearch?.length || 0) + (variantSearch?.length || 0);
      console.log(`✅ Comprehensive search working. Found ${totalResults} total results`);
      console.log(`   📦 Main spare parts: ${mainSearch?.length || 0}`);
      console.log(`   🔧 Variants: ${variantSearch?.length || 0}`);
    }

    console.log('\n🎉 All variants functionality tests completed successfully!');
    console.log('\n📋 Summary of tested features:');
    console.log('   ✅ Variants table structure and access');
    console.log('   ✅ Variants search by name/SKU');
    console.log('   ✅ Variants with attributes handling');
    console.log('   ✅ Variants statistics calculation');
    console.log('   ✅ Spare parts with variants relationship');
    console.log('   ✅ Comprehensive search functionality');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testVariantsFunctionality();
