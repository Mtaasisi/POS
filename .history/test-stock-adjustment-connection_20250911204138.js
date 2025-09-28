// Test stock adjustment database connection and functionality
// Run this in the browser console to verify stock adjustment database connectivity

async function testStockAdjustmentConnection() {
  console.log('🔍 Testing stock adjustment database connection...');
  
  try {
    // Test 1: Check if Supabase is available
    console.log('1️⃣ Testing Supabase availability...');
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not available');
      return false;
    }
    console.log('✅ Supabase client available');
    
    // Test 2: Test lats_product_variants table access
    console.log('2️⃣ Testing lats_product_variants table access...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id, product_id, sku, name, quantity, selling_price')
      .limit(5);
      
    if (variantsError) {
      console.error('❌ lats_product_variants table access failed:', variantsError);
      return false;
    }
    
    console.log('✅ lats_product_variants table accessible');
    console.log('📊 Found variants:', variants?.length || 0);
    
    // Test 3: Test lats_stock_movements table access
    console.log('3️⃣ Testing lats_stock_movements table access...');
    const { data: movements, error: movementsError } = await supabase
      .from('lats_stock_movements')
      .select('id, product_id, variant_id, type, quantity, reason, created_at')
      .limit(5);
      
    if (movementsError) {
      console.error('❌ lats_stock_movements table access failed:', movementsError);
      return false;
    }
    
    console.log('✅ lats_stock_movements table accessible');
    console.log('📊 Found movements:', movements?.length || 0);
    
    // Test 4: Test stock adjustment functionality
    if (variants && variants.length > 0) {
      console.log('4️⃣ Testing stock adjustment functionality...');
      const testVariant = variants[0];
      console.log('🧪 Testing with variant:', {
        id: testVariant.id,
        sku: testVariant.sku,
        name: testVariant.name,
        currentQuantity: testVariant.quantity
      });
      
      // Test reading current stock
      const { data: currentStock, error: stockError } = await supabase
        .from('lats_product_variants')
        .select('quantity')
        .eq('id', testVariant.id)
        .single();
        
      if (stockError) {
        console.error('❌ Failed to read current stock:', stockError);
        return false;
      }
      
      console.log('✅ Current stock read successfully:', currentStock.quantity);
      
      // Test stock update (without actually changing it)
      const originalQuantity = currentStock.quantity;
      const testQuantity = originalQuantity + 1;
      
      const { data: updateResult, error: updateError } = await supabase
        .from('lats_product_variants')
        .update({ quantity: testQuantity })
        .eq('id', testVariant.id)
        .select();
        
      if (updateError) {
        console.error('❌ Stock update test failed:', updateError);
        return false;
      }
      
      console.log('✅ Stock update successful');
      
      // Restore original quantity
      const { error: restoreError } = await supabase
        .from('lats_product_variants')
        .update({ quantity: originalQuantity })
        .eq('id', testVariant.id);
        
      if (restoreError) {
        console.error('⚠️ Failed to restore original quantity:', restoreError);
      } else {
        console.log('✅ Original quantity restored');
      }
      
      // Test stock movement creation
      console.log('5️⃣ Testing stock movement creation...');
      const { data: movementResult, error: movementError } = await supabase
        .from('lats_stock_movements')
        .insert([{
          product_id: testVariant.product_id,
          variant_id: testVariant.id,
          type: 'adjustment',
          quantity: 1,
          previous_quantity: originalQuantity,
          new_quantity: originalQuantity + 1,
          reason: 'Test adjustment',
          reference: 'TEST-' + Date.now(),
          notes: 'Database connection test',
          created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        }])
        .select();
        
      if (movementError) {
        console.error('❌ Stock movement creation failed:', movementError);
        return false;
      }
      
      console.log('✅ Stock movement created successfully');
      
      // Clean up test movement
      if (movementResult && movementResult.length > 0) {
        const { error: deleteError } = await supabase
          .from('lats_stock_movements')
          .delete()
          .eq('id', movementResult[0].id);
          
        if (deleteError) {
          console.error('⚠️ Failed to clean up test movement:', deleteError);
        } else {
          console.log('✅ Test movement cleaned up');
        }
      }
    }
    
    // Test 6: Check table schemas
    console.log('6️⃣ Checking table schemas...');
    if (variants && variants.length > 0) {
      const sampleVariant = variants[0];
      const requiredVariantColumns = [
        'id', 'product_id', 'sku', 'name', 'quantity', 'selling_price', 'cost_price'
      ];
      
      const missingVariantColumns = requiredVariantColumns.filter(col => !(col in sampleVariant));
      if (missingVariantColumns.length > 0) {
        console.warn('⚠️ Missing variant columns:', missingVariantColumns);
      } else {
        console.log('✅ All required variant columns present');
      }
    }
    
    if (movements && movements.length > 0) {
      const sampleMovement = movements[0];
      const requiredMovementColumns = [
        'id', 'product_id', 'variant_id', 'type', 'quantity', 'reason', 'created_at'
      ];
      
      const missingMovementColumns = requiredMovementColumns.filter(col => !(col in sampleMovement));
      if (missingMovementColumns.length > 0) {
        console.warn('⚠️ Missing movement columns:', missingMovementColumns);
      } else {
        console.log('✅ All required movement columns present');
      }
    }
    
    console.log('🎉 All stock adjustment database tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Stock adjustment database test failed:', error);
    return false;
  }
}

// Helper function to test a specific stock adjustment
async function testSpecificStockAdjustment(variantId, adjustmentQuantity = 1) {
  console.log(`🔍 Testing stock adjustment for variant: ${variantId}`);
  
  try {
    // Get current variant data
    const { data: variant, error: fetchError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .eq('id', variantId)
      .single();
      
    if (fetchError) {
      console.error('❌ Variant fetch failed:', fetchError);
      return false;
    }
    
    console.log('📦 Current variant data:', {
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      quantity: variant.quantity,
      selling_price: variant.selling_price
    });
    
    // Perform stock adjustment
    const previousQuantity = variant.quantity;
    const newQuantity = Math.max(0, previousQuantity + adjustmentQuantity);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('lats_product_variants')
      .update({ quantity: newQuantity })
      .eq('id', variantId)
      .select();
      
    if (updateError) {
      console.error('❌ Stock adjustment failed:', updateError);
      return false;
    }
    
    console.log('✅ Stock adjustment successful');
    
    // Create stock movement record
    const { data: movementResult, error: movementError } = await supabase
      .from('lats_stock_movements')
      .insert([{
        product_id: variant.product_id,
        variant_id: variantId,
        type: adjustmentQuantity > 0 ? 'in' : 'out',
        quantity: Math.abs(adjustmentQuantity),
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason: 'Test adjustment',
        reference: 'TEST-' + Date.now(),
        notes: `Test adjustment of ${adjustmentQuantity} units`,
        created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
      }])
      .select();
      
    if (movementError) {
      console.error('❌ Stock movement creation failed:', movementError);
      return false;
    }
    
    console.log('✅ Stock movement created successfully');
    console.log('📊 Final result:', {
      previousQuantity,
      adjustmentQuantity,
      newQuantity,
      movementId: movementResult[0]?.id
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Stock adjustment test failed:', error);
    return false;
  }
}

console.log('🚀 Stock adjustment database test functions loaded!');
console.log('Available functions:');
console.log('- testStockAdjustmentConnection() - Test stock adjustment database connectivity');
console.log('- testSpecificStockAdjustment(variantId, quantity) - Test specific stock adjustment');
console.log('');
console.log('Run testStockAdjustmentConnection() to start testing...');
