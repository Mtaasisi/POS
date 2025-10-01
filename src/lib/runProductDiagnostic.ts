import { ProductDiagnostic } from './productDiagnostic';

// Run this in the browser console to diagnose why W-King T8 isn't showing
export const runWKingT8Diagnostic = async () => {
  console.log('🔍 Running W-King T8 Diagnostic...\n');
  
  try {
    const result = await ProductDiagnostic.runFullDiagnostic('W-King T8');
    
    if (result.success) {
      console.log('\n✅ Diagnostic completed successfully!');
      console.log('\n📋 Summary:');
      console.log(`   Product Found: ${result.product.name}`);
      console.log(`   Product Active: ${result.product.is_active ? 'Yes' : 'No'}`);
      console.log(`   Total Quantity: ${result.product.total_quantity || 0}`);
      console.log(`   Variants: ${result.variants?.length || 0}`);
      
      if (result.variants && result.variants.length > 0) {
        const totalVariantStock = result.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        console.log(`   Total Variant Stock: ${totalVariantStock}`);
      }
      
      // Check if product might be hidden due to filters
      if (!result.product.is_active) {
        console.log('\n⚠️  ISSUE: Product is INACTIVE - this might be why it\'s not showing in inventory');
      }
      
      if (result.product.total_quantity <= 0) {
        console.log('\n⚠️  ISSUE: Product has no stock - might be filtered out by stock filters');
      }
      
      if (result.variants && result.variants.length === 0) {
        console.log('\n⚠️  ISSUE: Product has no variants - this might cause display issues');
      }
      
    } else {
      console.log('\n❌ Product not found. Possible reasons:');
      console.log('   1. Product name is different (check spelling)');
      console.log('   2. Product was not saved properly');
      console.log('   3. Product is in a different category/supplier');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error running diagnostic:', error);
    return { success: false, error: error.message };
  }
};

// Alternative search terms to try
export const searchAlternatives = async () => {
  const searchTerms = [
    'W-King',
    'T8',
    'w-king',
    't8',
    'W King',
    'WKing'
  ];
  
  console.log('🔍 Trying alternative search terms...\n');
  
  for (const term of searchTerms) {
    console.log(`\n🔎 Searching for: "${term}"`);
    const result = await ProductDiagnostic.findProduct(term);
    if (result.success && result.products && result.products.length > 0) {
      console.log(`✅ Found ${result.products.length} product(s) with term "${term}"`);
      result.products.forEach(p => console.log(`   - ${p.name} (Active: ${p.is_active})`));
    } else {
      console.log(`❌ No products found with term "${term}"`);
    }
  }
};
