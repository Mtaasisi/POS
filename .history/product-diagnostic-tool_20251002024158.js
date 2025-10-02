// Product Diagnostic Tool
// Run this in your browser console while on the inventory page

async function diagnoseProduct(productId) {
  console.log(`🔍 Diagnosing product: ${productId}`);
  
  try {
    // Get the Supabase client from your app
    const { supabase } = await import('./src/lib/supabaseClient.ts');
    
    // Check 1: Does product exist?
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.log('❌ Product not found in database:', productError.message);
      return;
    }
    
    console.log('✅ Product found:', product);
    
    // Check 2: Product variants
    const { data: variants } = await supabase
      .from('lats_product_variants')
      .select('*')
      .eq('product_id', productId);
    
    console.log(`📦 Product has ${variants?.length || 0} variants:`, variants);
    
    // Check 3: Calculate total stock
    const totalStock = variants?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
    console.log(`📊 Total stock: ${totalStock}`);
    
    // Check 4: Product status
    console.log(`🔍 Product status:`, {
      is_active: product.is_active,
      total_quantity: product.total_quantity,
      condition: product.condition
    });
    
    // Check 5: Why it might be filtered out
    const issues = [];
    
    if (!product.is_active) {
      issues.push('Product is inactive (is_active = false)');
    }
    
    if (totalStock <= 0) {
      issues.push('Product has no stock (would be filtered by out-of-stock filter)');
    } else if (totalStock <= 10) {
      issues.push('Product has low stock (would be filtered by in-stock filter)');
    }
    
    if (variants?.length === 0) {
      issues.push('Product has no variants');
    }
    
    if (issues.length > 0) {
      console.log('⚠️ Issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ No obvious issues found');
    }
    
    return {
      product,
      variants,
      totalStock,
      issues
    };
    
  } catch (error) {
    console.error('💥 Diagnostic error:', error);
  }
}

// Usage: diagnoseProduct('7f9b4123-e39c-4d71-8672-2a2c069d7eb0');
console.log('🔧 Product diagnostic tool loaded. Run: diagnoseProduct("7f9b4123-e39c-4d71-8672-2a2c069d7eb0")');
